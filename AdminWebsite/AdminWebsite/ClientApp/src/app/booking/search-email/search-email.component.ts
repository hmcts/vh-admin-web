import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Constants } from '../../common/constants';
import { ParticipantModel } from '../../common/model/participant.model';
import { SearchService } from '../../services/search.service';
import { ConfigService } from 'src/app/services/config.service';
import { Logger } from '../../services/logger';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { FormControl, Validators } from '@angular/forms';
import { exclusionValidator } from '../../shared/validators';
@Component({
    selector: 'app-search-email',
    templateUrl: './search-email.component.html',
    styleUrls: ['./search-email.component.scss'],
    providers: [SearchService]
})
export class SearchEmailComponent implements OnInit {
    private readonly loggerPrefix = '[SearchEmail] -';
    constants = Constants;
    participantDetails: ParticipantModel;
    searchTerm = new Subject<string>();
    results: ParticipantModel[] = [];
    //isShowResult = false;
    notFoundParticipant = false;
    email: string;
    isValidEmail = true;
    invalidPattern: string;
    isErrorEmailAssignedToJudge = false;
    isJoh = false;
    notFoundEmailEvent = new Subject<boolean>();
    notFoundEmailEvent$ = this.notFoundEmailEvent.asObservable();
    searchPending = new BehaviorSubject<boolean>(false);

    @Input() disabled = true;

    @Input() participantHearingRole = '';

    @Input() initialValue = '';

    @Output() findParticipant = new EventEmitter<ParticipantModel>();

    @Output() emailChanged = new EventEmitter<string>();

    results$: Observable<ParticipantModel[]>;
    emailControl: FormControl;
    selectedUser: ParticipantModel;
    showSearchResults$ = new BehaviorSubject<boolean>(false);

    constructor(private searchService: SearchService, private configService: ConfigService, private logger: Logger) {
        this.emailControl = new FormControl(this.initialValue, [Validators.required, Validators.minLength(2), Validators.maxLength(255), Validators.pattern(Constants.EmailPattern)])
     }

    ngOnInit() {
        this.emailControl.setValue(this.initialValue);

        this.results$ =
            this.searchTerm.pipe(
                debounceTime(500),
                distinctUntilChanged(),
                tap(() => this.validateEmail()),
                switchMap((term) => {
                    return this.searchService.participantSearch(term, this.participantHearingRole);
                }),
                tap(results => {
                    if(results.length) {
                        this.showSearchResults$.next(true);
                    }
                })
            );

        this.getEmailPattern();
    }

    async getEmailPattern() {
        this.configService
            .getClientSettings()
            .pipe(map(x => x.test_username_stem))
            .subscribe(x => {
                this.invalidPattern = x;
                this.setEmailValidators();
                if (!this.invalidPattern || this.invalidPattern.length === 0) {
                    this.logger.error(`${this.loggerPrefix} Pattern to validate email is not set`, new Error('Email validation error'));
                } else {
                    this.logger.info(`${this.loggerPrefix} Pattern to validate email is set with length ${this.invalidPattern.length}`);
                }
            })
    }

    selectUser(result: ParticipantModel) {
        this.selectedUser = { ...result, is_exist_person: true };
        this.emailControl.setValue(result.email);
        this.hideSearchResults();
        this.findParticipant.emit(this.selectedUser);
    }

    validateEmail() {
        if (this.isParticipantJudge() && this.emailControl.valid) {
            return this.results != null && this.results.length === 1 && this.results[0].username === this.email;
        }
    }

    hideSearchResults() {
        this.showSearchResults$.next(false);
    }

    clearEmail() {
        this.email = '';
        this.isValidEmail = true;
        this.notFoundParticipant = false;
    }

    blurEmail() {
        if (!this.results || this.results.length === 0) {
            this.validateEmail();
            this.emailChanged.emit(this.email);
        }

        if (this.isParticipantJudge()) {
            this.searchPending.subscribe(pending => {
                if (!pending) {
                    let judgeFound: ParticipantModel;
                    if (this.isValidEmail && this.results && this.results.length > 0) {
                        judgeFound = this.results.find(result => result.email.toLowerCase() === this.email.toLowerCase());
                    }
                    if (judgeFound) {
                        this.selectUser(judgeFound);
                    } else {
                        this.findParticipant.emit(null);
                    }

                }
            });
        }
    }

    // was on (input)
    // onChange() {
    //     this.isErrorEmailAssignedToJudge = false;
    // }

    populateParticipantInfo(email: string) {
        if (this.results && this.results.length > 0) {
            const participant = this.results.find(p => p.email === email);
            if (participant) {
                this.selectUser(participant);
            }
        }
    }

    private isParticipantJudge(): boolean {
        return this.participantHearingRole === "Judge";
    }

    private setEmailValidators() {
        const validators = [Validators.required, Validators.minLength(2), Validators.maxLength(255), Validators.pattern(Constants.EmailPattern)];
        if(this.invalidPattern) {
            console.log('in', this.invalidPattern);
            validators.push(exclusionValidator(this.invalidPattern));
        }
        this.emailControl.setValidators(validators);
    }
}
