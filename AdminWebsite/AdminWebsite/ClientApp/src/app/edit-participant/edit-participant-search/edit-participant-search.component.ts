import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantEditService } from '../../services/participant-edit-service.service';

@Component({
    selector: 'app-edit-participant-search',
    templateUrl: './edit-participant-search.component.html'
})
export class EditParticipantSearchComponent implements OnInit {
    private readonly loggerPrefix = '[EditParticipant] -';
    form: FormGroup;
    hasSearched: boolean;
    unauthorisedParticipant: boolean;
    loadingData: boolean;
    result: ParticipantEditResultModel;
    constructor(
        private readonly fb: FormBuilder,
        private readonly service: ParticipantEditService,
        private readonly logger: Logger
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            contactEmail: ['', Validators.required]
        });
    }

    get contactEmail() {
        return this.form.get('contactEmail');
    }

    clearSearch() {
        this.hasSearched = false;
        this.result = undefined;
    }

    async search(): Promise<void> {
        if (this.form.valid) {
            this.logger.debug(`${this.loggerPrefix} Attempting to search for contact email`, { contactEmail: this.contactEmail.value });
            this.loadingData = true;
            this.hasSearched = false;
            this.result = await this.getResults(this.contactEmail.value);
            this.hasSearched = true;
            this.loadingData = false;
        }
    }

    async getResults(username: string): Promise<ParticipantEditResultModel> {
        try {
            const response = await this.service.searchForPerson(username);
            if (response) {
                this.logger.debug(`${this.loggerPrefix} Found user`, { contactEmail: this.contactEmail.value });
                return response;
            } else {
                this.logger.warn(`${this.loggerPrefix} Contact email not found`, { contactEmail: this.contactEmail.value });
                return null;
            }
        } catch (error) {
            if (error?.status === 401) {
                this.unauthorisedParticipant = true;
            }
            return null;
        }
    }
}
