import { Component, EventEmitter, Output, OnInit, Input, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { Constants } from '../../common/constants';
import { ParticipantModel } from '../../common/model/participant.model';
import { SearchService } from '../../services/search.service';
import { ConfigService } from 'src/app/services/config.service';
import { Logger } from '../../services/logger';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

@Component({
    selector: 'app-search-email',
    templateUrl: './search-email.component.html',
    styleUrls: ['./search-email.component.css'],
    providers: [SearchService]
})
export class SearchEmailComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[SearchEmail] -';
    constants = Constants;
    participantDetails: ParticipantModel;
    searchTerm = new Subject<string>();
    results: ParticipantModel[] = [];
    isShowResult = false;
    notFoundParticipant = false;
    email: string;
    isValidEmail = true;
    $subscriptions: Subscription[] = [];
    invalidPattern: string;
    isErrorEmailAssignedToJudge = false;
    isJoh = false;
    notFoundEmailEvent = new Subject<boolean>();
    notFoundEmailEvent$ = this.notFoundEmailEvent.asObservable();
    searchPending = new BehaviorSubject<boolean>(false);
    private judgeHearingRole = 'Judge';
    private judiciaryRoles = this.constants.JudiciaryRoles;
    private cannotAddNewUsersRoles = [this.judgeHearingRole, ...this.judiciaryRoles];
    blurSubscription = new Subscription();

    @Input() disabled = true;

    @Input() hearingRoleParticipant = '';

    @Input() initialValue = '';

    @Output() findParticipant = new EventEmitter<ParticipantModel>();

    @Output() emailChanged = new EventEmitter<string>();

    constructor(private searchService: SearchService, private configService: ConfigService, private logger: Logger) {}

    ngOnInit() {
        this.email = this.initialValue;
        this.$subscriptions.push(
            this.searchTerm
                .pipe(
                    debounceTime(500),
                    distinctUntilChanged(),
                    tap(() => {
                        this.searchPending.next(true);
                    }),
                    switchMap(term => {
                        return this.searchService.participantSearch(term, this.hearingRoleParticipant);
                    }),
                    tap(personsFound => {
                        if (personsFound && personsFound.length > 0) {
                            this.getData(personsFound);
                        } else {
                            if (this.email.length > 2) {
                                this.noDataFound();
                            } else {
                                this.lessThanThreeLetters();
                            }
                            this.isShowResult = false;
                            this.results = undefined;
                        }
                        this.searchPending.next(false);
                    })
                )
                .subscribe()
        );

        this.$subscriptions.push(this.searchTerm.subscribe(s => (this.email = s)));
        this.getEmailPattern();
        this.$subscriptions.push(this.blurSubscription);
    }

    async getEmailPattern() {
        this.$subscriptions.push(
            this.configService
                .getClientSettings()
                .pipe(map(x => x.test_username_stem))
                .subscribe(x => {
                    this.invalidPattern = x;
                    if (!this.invalidPattern || this.invalidPattern.length === 0) {
                        this.logger.error(`${this.loggerPrefix} Pattern to validate email is not set`, new Error('Email validation error'));
                    } else {
                        this.logger.info(`${this.loggerPrefix} Pattern to validate email is set with length ${this.invalidPattern.length}`);
                    }
                })
        );
    }

    getData(data: ParticipantModel[]) {
        this.results = data;
        this.isShowResult = true;
        this.isValidEmail = true;
        this.notFoundParticipant = false;
        this.notFoundEmailEvent.next(false);
    }

    noDataFound() {
        this.isErrorEmailAssignedToJudge = this.hearingRoleParticipant === 'Panel Member' || this.hearingRoleParticipant === 'Winger';
        this.isShowResult = false;
        this.notFoundParticipant = !this.isErrorEmailAssignedToJudge;
        this.notFoundEmailEvent.next(true);
    }

    lessThanThreeLetters() {
        this.isShowResult = false;
        this.notFoundParticipant = false;
        this.notFoundEmailEvent.next(false);
    }

    selectItemClick(result: ParticipantModel) {
        this.email = result.email;

        const selectedResult = new ParticipantModel();
        selectedResult.email = result.email;
        selectedResult.first_name = result.first_name;
        selectedResult.last_name = result.last_name;
        selectedResult.title = result.title;
        selectedResult.phone = result.phone;
        selectedResult.company = result.company;
        selectedResult.is_exist_person = true;
        selectedResult.username = result.username;
        selectedResult.display_name = result.display_name;
        selectedResult.is_courtroom_account = result.is_courtroom_account; // ? Why not just return result?
        selectedResult.case_role_name = this.hearingRoleParticipant;
        selectedResult.hearing_role_name = this.hearingRoleParticipant;
        this.isShowResult = false;
        this.findParticipant.emit(selectedResult);
    }

    validateEmail() {
        const pattern = Constants.EmailPattern;
        this.isValidEmail =
            this.email &&
            this.email.length > 2 &&
            this.email.length < 256 &&
            pattern.test(this.email) &&
            this.email.indexOf(this.invalidPattern) < 0;

        if (this.hearingRoleParticipant === this.judgeHearingRole && this.isValidEmail) {
            this.isValidEmail = this.results != null && this.results.length === 1 && this.results[0].username === this.email;
        }

        return this.isValidEmail;
    }

    blur() {
        this.isShowResult = false;
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

        if (this.hearingRoleParticipant === this.judgeHearingRole) {
            this.blurSubscription.unsubscribe();
            this.blurSubscription = this.searchPending.subscribe(pending => {
                if (!pending) {
                    let judgeFound: ParticipantModel;
                    if (this.isValidEmail && this.results && this.results.length > 0) {
                        judgeFound = this.results.find(result => result.email.toLowerCase() === this.email.toLowerCase());
                    }
                    if (judgeFound) {
                        this.selectItemClick(judgeFound);
                    } else {
                        this.findParticipant.emit(null);
                    }
                    this.blurSubscription.unsubscribe();
                }
            });
        }
    }

    onChange() {
        this.isErrorEmailAssignedToJudge = false;
    }

    ngOnDestroy() {
        this.$subscriptions.forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }

    populateParticipantInfo(email: string) {
        if (this.results && this.results.length > 0) {
            const participant = this.results.find(p => p.email === email);
            if (participant) {
                this.selectItemClick(participant);
            }
        }
    }

    get showCreateNewUserWarning() {
        return this.notFoundParticipant && !this.cannotAddNewUsersRoles.includes(this.hearingRoleParticipant);
    }
}
