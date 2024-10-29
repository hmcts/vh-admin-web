import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '../../../services/logger';
import { VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { HoursType } from '../../../common/model/hours-type';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { SearchResults } from '../search-results-model';
import { EditWorkHoursService } from '../../services/edit-work-hours.service';

@Component({
    selector: 'app-vho-search',
    templateUrl: './vho-search.component.html'
})
export class VhoSearchComponent implements OnInit {
    form: FormGroup;
    error: string = null;

    private readonly loggerPrefix = 'vho-search';
    private readonly filterSize = 20;

    @Output() hoursTypeEmitter = new EventEmitter<HoursType>();
    @Output() usernameEmitter = new EventEmitter<string>();
    @Output() vhoSearchEmitter = new EventEmitter<SearchResults>();
    @Output() dataChange = new EventEmitter<boolean>();

    @Input() dataChangedBroadcast = new EventEmitter<boolean>();

    @ViewChild('workingOptionRef', { read: ElementRef, static: true }) workingOptionRef: ElementRef;
    @ViewChild('nonWorkingOptionRef', { read: ElementRef, static: true }) nonWorkingOptionRef: ElementRef;

    showSaveConfirmation = false;

    get username() {
        return this.form.get('username');
    }

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly logger: Logger,
        private readonly service: EditWorkHoursService,
        private readonly videoService: VideoHearingsService
    ) {}

    ngOnInit(): void {
        this.form = this.formBuilder.group({
            username: ['', Validators.required],
            hoursType: ['', Validators.required]
        });
        this.dataChangedBroadcast.subscribe(x => {
            if (!x) {
                this.handleContinue();
            } else {
                this.cancelEditing();
            }
        });
        this.service.fetchNonWorkHours$.subscribe(async refresh => {
            await this.search(refresh);
        });
    }

    async search(refresh: boolean = false): Promise<void> {
        if (this.form.valid) {
            const hoursType: HoursType = this.form.controls['hoursType'].value;
            this.error = null;
            const userName = this.username.value;
            this.logger.debug(`${this.loggerPrefix} Attempting to search for username`, { userName });
            try {
                let result: VhoWorkHoursResponse[] | VhoNonAvailabilityWorkHoursResponse[];
                switch (hoursType) {
                    case HoursType.WorkingHours:
                        result = await this.service.getWorkAvailabilityForVho(this.username.value);
                        break;
                    case HoursType.NonWorkingHours:
                        result = await this.service.getNonWorkAvailabilityForVho(this.username.value);
                        if (!result) {
                            break;
                        }
                        result = result.sort((objA, objB) => objA.start_time.getTime() - objB.start_time.getTime());
                        break;
                }
                if (result) {
                    this.hoursTypeEmitter.emit(hoursType);
                    this.vhoSearchEmitter.emit({ result, refresh });
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
        this.vhoSearchEmitter.emit({ refresh: false, result: null });
    }

    isDataChanged(): boolean {
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
        this.dataChange.emit(false);
    }

    cancelEditing() {
        this.videoService.cancelVhoNonAvailabiltiesRequest();
        this.showSaveConfirmation = false;
        this.dataChange.emit(false);
        const result: SearchResults = { refresh: false, result: null };
        this.vhoSearchEmitter.emit(result);
    }

    changeSearch() {
        if (this.isDataChanged()) {
            this.showSaveConfirmation = true;
            this.dataChange.emit(true);
        }
    }
}
