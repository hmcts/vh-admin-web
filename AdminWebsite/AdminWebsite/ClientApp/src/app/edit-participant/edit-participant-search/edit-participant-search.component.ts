import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
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
    loadingData: boolean;
    result: ParticipantEditResultModel;
    subscriptions$ = new Subscription();
    constructor(private fb: FormBuilder, private service: ParticipantEditService, private logger: Logger) {}

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
        const response = await this.service.searchForPerson(username);
        if (response) {
            this.logger.debug(`${this.loggerPrefix} Found user`, { contactEmail: this.contactEmail.value });
            return response;
        } else {
            this.logger.warn(`${this.loggerPrefix} Contact email not found`, { contactEmail: this.contactEmail.value });
            return null;
        }
    }
}
