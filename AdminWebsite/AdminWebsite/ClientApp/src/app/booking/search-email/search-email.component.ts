import { Component, EventEmitter, Output, OnInit, Input, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { PersonResponse } from '../../services/clients/api-client';
import { Constants } from '../../common/constants';
import { ParticipantModel } from '../../common/model/participant.model';
import { SearchService } from '../../services/search.service';
import { ConfigService } from 'src/app/services/config.service';
import { Logger } from '../../services/logger';

@Component({
    selector: 'app-search-email',
    templateUrl: './search-email.component.html',
    styleUrls: ['./search-email.component.css'],
    providers: [SearchService]
})
export class SearchEmailComponent implements OnInit, OnDestroy {
    constants = Constants;
    participantDetails: ParticipantModel;
    searchTerm = new Subject<string>();
    results: ParticipantModel[] = [];
    isShowResult = false;
    notFoundParticipant = false;
    email = '';
    isValidEmail = true;
    $subscriptions: Subscription[] = [];
    invalidPattern: string;

    @Input()
    disabled = true;

    @Output()
    findParticipant = new EventEmitter<ParticipantModel>();

    @Output()
    participantsNotFound = new EventEmitter();

    @Output()
    emailChanged = new EventEmitter<string>();

    constructor(private searchService: SearchService, private configService: ConfigService, private logger: Logger) {}

    ngOnInit() {
        this.$subscriptions.push(
            this.searchService.search(this.searchTerm).subscribe(data => {
                if (data && data.length > 0) {
                    this.getData(data);
                } else {
                    if (this.email.length > 2) {
                        this.noDataFound();
                    } else {
                        this.lessThanThreeLetters();
                    }
                    this.isShowResult = false;
                    this.results = undefined;
                }
            })
        );

        this.$subscriptions.push(this.searchTerm.subscribe(s => (this.email = s)));
        this.getEmailPattern();
    }

    async getEmailPattern() {
        const settings = await this.configService.getClientSettings().toPromise();
        this.invalidPattern = settings.test_username_stem;
        if (!this.invalidPattern || this.invalidPattern.length === 0) {
            this.logger.error(`Pattern to validate email is not set`, new Error('Email validation error'));
        } else {
            this.logger.info(`Pattern to validate email is set with length ${this.invalidPattern.length}`);
        }
    }

    getData(data: PersonResponse[]) {
        this.results = data.map(x => this.mapPersonResponseToParticipantModel(x));
        this.isShowResult = true;
        this.isValidEmail = true;
        this.notFoundParticipant = false;
    }

    noDataFound() {
        this.isShowResult = false;
        this.notFoundParticipant = true;
        this.participantsNotFound.emit();
    }

    lessThanThreeLetters() {
        this.isShowResult = false;
        this.notFoundParticipant = false;
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
        this.isShowResult = false;
        this.findParticipant.emit(selectedResult);
    }

    validateEmail() {
        /* tslint:disable: max-line-length */
        const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        this.isValidEmail =
            this.email &&
            this.email.length > 0 &&
            this.email.length < 256 &&
            pattern.test(this.email.toLowerCase()) &&
            this.email.toLowerCase().indexOf(this.invalidPattern) < 0;
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
    }

    mapPersonResponseToParticipantModel(p: PersonResponse): ParticipantModel {
        let participant: ParticipantModel;
        if (p) {
            participant = new ParticipantModel();
            participant.id = p.id;
            participant.title = p.title;
            participant.first_name = p.first_name;
            participant.middle_names = p.middle_names;
            participant.last_name = p.last_name;
            participant.username = p.username;
            participant.email = p.contact_email;
            participant.phone = p.telephone_number;
            participant.representee = '';
            participant.reference = '';
            participant.company = p.organisation;
        }

        return participant;
    }

    ngOnDestroy() {
        this.$subscriptions.forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }
}
