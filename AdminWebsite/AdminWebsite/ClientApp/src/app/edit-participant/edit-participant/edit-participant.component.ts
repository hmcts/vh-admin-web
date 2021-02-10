import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantEditService } from 'src/app/services/participant-edit-service.service';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-edit-participant',
    templateUrl: './edit-participant.component.html',
    styleUrls: ['./edit-participant.component.scss']
})
export class EditParticipantComponent implements OnInit {
    private readonly loggerPrefix = '[EditParticipant] -';
    form: FormGroup;
    person: ParticipantEditResultModel;
    updateComplete: boolean;
    showSpinner: boolean;
    constructor(private service: ParticipantEditService, private router: Router, private fb: FormBuilder, private logger: Logger) {}

    ngOnInit(): void {
        this.person = this.service.retrieveParticipantToEdit();
        if (!this.person) {
            this.router.navigateByUrl(PageUrls.EditParticipantSearch);
            return;
        }

        this.form = this.fb.group({
            firstName: [this.person.firstname, Validators.required],
            lastName: [this.person.lastName, Validators.required]
        });
    }

    get firstName() {
        return this.form.get('firstName');
    }

    get lastName() {
        return this.form.get('lastName');
    }

    async updateParticipant() {
        if (this.form.valid) {
            this.logger.debug(`${this.loggerPrefix} Attempting to update participant`, { person: this.person.personId });
            try {
                this.showSpinner = true;
                await this.service.updateParticipantName(
                    this.person.personId,
                    this.person.currentUsername,
                    this.firstName.value,
                    this.lastName.value
                );
                this.showSpinner = false;
                this.updateComplete = true;
            } catch (err) {
                this.showSpinner = false;
                this.logger.error(`${this.loggerPrefix} Failed to update participant`, err, { person: this.person.personId });
            }
        }
    }

    cancelEdit() {
        this.router.navigateByUrl(PageUrls.Dashboard);
    }
}
