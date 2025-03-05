import { Component, EventEmitter, Output, OnInit, Input, OnDestroy } from '@angular/core';
import { NEVER, Subject, Subscription } from 'rxjs';
import { Constants } from '../../common/constants';
import { SearchService } from '../../services/search.service';
import { ConfigService } from 'src/app/services/config.service';
import { Logger } from '../../services/logger';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Component({
    selector: 'app-search-email',
    templateUrl: './search-email.component.html',
    styleUrls: ['./search-email.component.css'],
    providers: [SearchService],
    standalone: false
})
export class SearchEmailComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[SearchEmail] -';
    constants = Constants;
    participantDetails: VHParticipant;
    searchTerm = new Subject<string>();
    results: VHParticipant[] = [];
    isShowResult = false;
    notFoundParticipant = false;

    email: string;

    isValidEmail = true;
    $subscriptions: Subscription[] = [];
    invalidPattern: string;
    isErrorEmailAssignedToJudge = false;
    isJoh = false;
    emailFoundEvent = new Subject<void>();
    emailFoundEvent$ = this.emailFoundEvent.asObservable();
    emailNotFoundEvent = new Subject<void>();
    emailNotFoundEvent$ = this.emailNotFoundEvent.asObservable();
    private readonly cannotAddNewUsersRoles = [this.constants.Judge];

    @Input() disabled = true;

    @Input() hearingRoleParticipant = '';

    @Input() initialValue = '';

    @Input() locator = 'participantEmail';

    @Output() findParticipant = new EventEmitter<VHParticipant>();

    @Output() emailChanged = new EventEmitter<string>();

    constructor(
        private readonly searchService: SearchService,
        private readonly configService: ConfigService,
        private readonly logger: Logger
    ) {}

    ngOnInit() {
        this.email = this.initialValue;
        this.$subscriptions.push(
            this.searchTerm
                .pipe(
                    debounceTime(2000),
                    distinctUntilChanged(),
                    switchMap(term => {
                        // do not wait for valid email to be completed, partial search is allowed
                        if (term.length > 2) {
                            return this.searchService.participantSearch(term, this.hearingRoleParticipant);
                        } else {
                            this.lessThanThreeLetters();
                            return NEVER;
                        }
                    }),
                    tap(personsFound => {
                        if (personsFound && personsFound.length > 0) {
                            this.setData(personsFound);
                        } else {
                            this.noDataFound();
                            this.isShowResult = false;
                            this.results = undefined;
                        }
                    })
                )
                .subscribe()
        );

        this.$subscriptions.push(this.searchTerm.subscribe(s => (this.email = s)));
        this.getEmailPattern();
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

    setData(data: VHParticipant[]) {
        this.results = data;
        this.isShowResult = true;
        this.isValidEmail = true;
        this.notFoundParticipant = false;
        this.emailFoundEvent.next();
    }

    noDataFound() {
        this.isShowResult = false;
        this.notFoundParticipant = !this.isErrorEmailAssignedToJudge;
        this.emailNotFoundEvent.next();
    }

    lessThanThreeLetters() {
        this.isShowResult = false;
        this.notFoundParticipant = false;
        this.emailFoundEvent.next();
    }

    selectItemClick(result: VHParticipant) {
        this.email = result.email;

        const selectedResult = new VHParticipant();
        selectedResult.email = result.email;
        selectedResult.firstName = result.firstName;
        selectedResult.lastName = result.lastName;
        selectedResult.title = result.title;
        selectedResult.phone = result.phone;
        selectedResult.company = result.company;
        selectedResult.isExistPerson = true;
        selectedResult.username = result.username;
        selectedResult.displayName = result.displayName;
        selectedResult.isCourtroomAccount = result.isCourtroomAccount;
        selectedResult.contactEmail = result.contactEmail;
        this.isShowResult = false;
        this.findParticipant.emit(selectedResult);
    }

    validateEmail() {
        this.isValidEmail = this.emailIsValid();
        return this.isValidEmail;
    }

    emailIsValid() {
        const pattern = Constants.EmailPattern;
        let isValidEmail = this.email && this.email.length > 2 && this.email.length < 256 && pattern.test(this.email);
        if (!this.isJudge) {
            isValidEmail = isValidEmail && this.email.indexOf(this.invalidPattern) < 0;
        }
        return isValidEmail;
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
        const userAlreadyExists = this.results?.some(p => p.email === this.email);
        const emailIsValid = this.emailIsValid();

        if (!this.results || this.results.length === 0 || (emailIsValid && !userAlreadyExists)) {
            this.validateEmail();
            this.emailChanged.emit(this.email);
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
        if (this.results?.length) {
            const participant = this.results.find(p => p.email === email);
            if (participant) {
                this.selectItemClick(participant);
                return;
            }
        }

        if (this.isJudge && email !== this.initialValue) {
            this.findParticipant.emit(null);
        }
    }

    get showCreateNewUserWarning() {
        return this.notFoundParticipant && !this.cannotAddNewUsersRoles.includes(this.hearingRoleParticipant);
    }

    get isJudge() {
        return this.hearingRoleParticipant === this.constants.Judge;
    }
}
