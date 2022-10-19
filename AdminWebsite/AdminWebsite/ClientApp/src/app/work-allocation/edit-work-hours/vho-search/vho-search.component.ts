import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '../../../services/logger';
import { EditWorkHoursService } from '../../../services/edit-work-hours.service';
import { VhoSearchResponse } from '../../../services/clients/api-client';

@Component({
    selector: 'app-vho-search',
    templateUrl: './vho-search.component.html',
    styleUrls: ['./vho-search.component.css']
})
export class VhoSearchComponent implements OnInit {
    form: FormGroup;
    error: string = null;
    private loggerPrefix = 'vho-search';

    @Output() vhoSearchEmitter = new EventEmitter<VhoSearchResponse>();

    get username() {
        return this.form.get('username');
    }

    constructor(private formBuilder: FormBuilder, private service: EditWorkHoursService, private logger: Logger) {}

    ngOnInit(): void {
        this.form = this.formBuilder.group({
            username: ['', Validators.required]
        });
    }

    async search(): Promise<void> {
        if (this.form.valid) {
            this.error = null;
            this.logger.debug(`${this.loggerPrefix} Attempting to search for username`, { username: this.username.value });
            try {
                const result = await this.service.searchForVho(this.username.value);
                if (result) {
                    this.vhoSearchEmitter.emit(result);
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
