import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Logger } from 'src/app/services/logger';
import { ParticipantHearingDeleteResultModel } from '../../common/model/participant-hearing-delete-result-model';
import { ParticipantDeleteService } from '../../services/participant-delete-service.service';

@Component({
    selector: 'app-delete-participant',
    templateUrl: './delete-participant-search.component.html'
})
export class DeleteParticipantSearchComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[DeleteParticipant] -';
    form: FormGroup;
    hasSearched: boolean;
    loadingData: boolean;
    results: ParticipantHearingDeleteResultModel[] = [];
    subscriptions$ = new Subscription();
    constructor(
        private fb: FormBuilder,
        private service: ParticipantDeleteService,
        private route: ActivatedRoute,
        private logger: Logger
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            username: ['', Validators.required]
        });

        this.checkAndApplyQueryParam();
    }

    ngOnDestroy(): void {
        this.subscriptions$.unsubscribe();
    }

    private checkAndApplyQueryParam() {
        this.subscriptions$.add(
            this.route.queryParams.subscribe(async params => {
                if (params['username']) {
                    const username = params['username'];
                    this.logger.debug(`${this.loggerPrefix} Found username in url. Starting search`, { username });
                    this.username.setValue(username);
                    await this.search();
                }
            })
        );
    }

    get username() {
        return this.form.get('username');
    }

    async search() {
        if (this.form.valid) {
            this.logger.debug(`${this.loggerPrefix} Attempting to search for hearings for username`, { username: this.username.value });
            this.loadingData = true;
            this.hasSearched = false;
            this.results = await this.getResults(this.username.value);
            this.hasSearched = true;
            this.loadingData = false;
        }
    }

    async getResults(username: string) {
        const response = await this.service.getHearingsForUsername(username);
        if (response) {
            this.logger.debug(`${this.loggerPrefix} Found hearings for user`, { username: this.username.value });
            return response.map(x => {
                return new ParticipantHearingDeleteResultModel(x);
            });
        } else {
            this.logger.warn(`${this.loggerPrefix} Username not found`, { username: this.username.value });
            return null;
        }
    }
}
