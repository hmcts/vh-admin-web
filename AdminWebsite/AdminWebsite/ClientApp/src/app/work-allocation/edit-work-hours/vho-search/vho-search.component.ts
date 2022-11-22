import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '../../../services/logger';
import { VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { HoursType } from '../../../common/model/hours-type';
import { EditWorkHoursService } from '../../../services/edit-work-hours.service';
import { VideoHearingsService } from '../../../services/video-hearings.service';

@Component({
    selector: 'app-vho-search',
    templateUrl: './vho-search.component.html'
})
export class VhoSearchComponent implements OnInit {
    form: FormGroup;
    error: string = null;

    private loggerPrefix = 'vho-search';
    private filterSize = 20;

    @Output() usernameEmitter = new EventEmitter<string>();
    @Output() vhoSearchEmitter = new EventEmitter<VhoWorkHoursResponse[] | VhoNonAvailabilityWorkHoursResponse[]>();
    showSaveConfirmation = false;

    @ViewChild('workingOptionRef', { read: ElementRef, static: true }) workingOptionRef: ElementRef;
    @ViewChild('nonWorkingOptionRef', { read: ElementRef, static: true }) nonWorkingOptionRef: ElementRef;

    get username() {
        return this.form.get('username');
    }

    constructor(
        private formBuilder: FormBuilder,
        private logger: Logger,
        private service: EditWorkHoursService,
        private videoService: VideoHearingsService
    ) {}

    ngOnInit(): void {
        this.form = this.formBuilder.group({
            username: ['', Validators.required],
            hoursType: ['', Validators.required]
        });
    }

    async search(): Promise<void> {
        if (this.form.valid) {
            const hoursType: HoursType = this.form.controls['hoursType'].value;
            this.error = null;
            const userName = this.username.value;
            this.logger.debug(`${this.loggerPrefix} Attempting to search for username`, { userName });
            try {
                let result;
                switch (hoursType) {
                    case HoursType.WorkingHours:
                        result = await this.service.getWorkAvailabilityForVho(this.username.value);
                        break;
                    case HoursType.NonWorkingHours:
                        result = await this.service.getNonWorkAvailabilityForVho(this.username.value);
                        if (!result) {
                            break;
                        }
                        result = result
                            .sort((objA, objB) => objA.start_time.getTime() - objB.start_time.getTime())
                            .slice(0, this.filterSize);
                        break;
                }
                if (result) {
                    this.vhoSearchEmitter.emit(result);
                    this.usernameEmitter.emit(this.username.value);
                } else {
                    this.error = 'User could not be found. Please check the username and try again';
                    this.clear();
                }
            } catch (error) {
                this.error = error.message;
            }
        }
    }

    clear() {
        this.vhoSearchEmitter.emit(null);
    }

    isDataChaged(): boolean {
        return this.videoService.hasUnsavedVhoNonAvailabilityChanges();
    }

    handleContinue() {
        const hoursType: HoursType = this.form.controls['hoursType'].value;
        if (hoursType === HoursType.WorkingHours) {
            this.nonWorkingOptionRef.nativeElement.focus();
            this.nonWorkingOptionRef.nativeElement.click();
        } else {
            this.workingOptionRef.nativeElement.focus();
            this.workingOptionRef.nativeElement.click();
        }
        this.showSaveConfirmation = false;
    }

    cancelEditing() {
        this.videoService.cancelVhoNonAvailabiltiesRequest();
        this.showSaveConfirmation = false;
        this.vhoSearchEmitter.emit(null);
    }

    changeSearch() {
        if (this.isDataChaged()) {
            this.showSaveConfirmation = true;
        }
    }
}
