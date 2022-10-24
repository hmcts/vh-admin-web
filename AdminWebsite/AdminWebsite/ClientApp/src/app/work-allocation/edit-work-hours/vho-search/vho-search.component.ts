import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '../../../services/logger';
import { EditWorkHoursService } from '../../../services/edit-work-hours.service';
import { VhoWorkHoursResponse } from '../../../services/clients/api-client';

@Component({
    selector: 'app-vho-search',
    templateUrl: './vho-search.component.html'
})
export class VhoSearchComponent implements OnInit {
    form: FormGroup;
    error: string = null;

    private loggerPrefix = 'vho-search';

    @Output() usernameEmitter = new EventEmitter<string>();
    @Output() vhoSearchEmitter = new EventEmitter<VhoWorkHoursResponse[]>();

    get username() {
        return this.form.get('username');
    }

    constructor(private formBuilder: FormBuilder, private service: EditWorkHoursService, private logger: Logger) {}

    ngOnInit(): void {
        this.form = this.formBuilder.group({
            // If username is prepopulated please leave comment.
            // This was only to make dev work easier
            username: ['manual.vhoteamlead1@hearings.reform.hmcts.net', Validators.required]
        });
    }

    async search(): Promise<void> {
        if (this.form.valid) {
            this.error = null;
            this.logger.debug(`${this.loggerPrefix} Attempting to search for username`, { username: this.username.value });
            try {
                const result = await this.service.getWorkAvailabilityForVho(this.username.value);
                if (result) {
                    this.vhoSearchEmitter.emit(result);
                    this.usernameEmitter.emit(this.username.value);
                } else {
                    this.error = 'User could not be found. Please check the username and try again';
                }
            } catch (error) {
                this.error = error.message;
            }
        }
    }

    clear() {
        this.vhoSearchEmitter.emit(null);
    }
}
