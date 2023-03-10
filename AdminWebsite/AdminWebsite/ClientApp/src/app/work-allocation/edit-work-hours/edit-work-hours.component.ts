import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { Logger } from 'src/app/services/logger';
import {
    BHClient,
    UploadWorkHoursRequest,
    VhoWorkHoursResponse,
    VhoNonAvailabilityWorkHoursResponse,
    WorkingHours,
    UpdateNonWorkingHoursRequest,
    NonWorkingHours
} from '../../services/clients/api-client';
import { VhoWorkHoursTableComponent } from './vho-work-hours-table/vho-work-hours-table.component';
import { EditVhoNonAvailabilityWorkHoursModel } from './edit-non-work-hours-model';
import { CombineDateAndTime } from '../../common/formatters/combine-date-and-time';
import { HoursType } from 'src/app/common/model/hours-type';
import { SearchResults } from './search-results-model';

@Component({
    selector: 'app-edit-work-hours',
    templateUrl: './edit-work-hours.component.html'
})
export class EditWorkHoursComponent implements OnInit {
    loggerPrefix = 'EditWorkHoursComponent';
    workHours: VhoWorkHoursResponse[];
    nonWorkHours: EditVhoNonAvailabilityWorkHoursModel[];
    hoursType: HoursType;
    username: string;

    isUploadWorkHoursSuccessful = false;
    isUploadWorkHoursFailure = false;
    todayDate: Date = new Date();
    isUploadNonWorkHoursSuccessful = false;
    showSaveNonWorkHoursFailedPopup = false;
    saveNonWorkHoursCompleted$: Subject<boolean> = new Subject();

    result: VhoWorkHoursResponse[] | VhoNonAvailabilityWorkHoursResponse[];
    showWorkHoursTable = false;
    showNonWorkHoursTable = false;

    @Input() isVhTeamLeader: boolean;
    @Input() dataChangedBroadcast = new EventEmitter<boolean>();
    @Output() dataChange = new EventEmitter<boolean>();

    @ViewChild(VhoWorkHoursTableComponent) vhoWorkHoursTableComponent!: VhoWorkHoursTableComponent;

    constructor(private bhClient: BHClient, private logger: Logger) {}

    ngOnInit(): void {
        this.dataChangedBroadcast.subscribe(x => {
            this.dataChanged(x);
        });
    }

    onSaveWorkHours($event: VhoWorkHoursResponse[]) {
        this.workHours = $event;
        this.saveWorkHours();
    }

    saveWorkHours() {
        this.isUploadWorkHoursSuccessful = false;
        this.isUploadWorkHoursFailure = false;

        const uploadWorkHoursRequest = new UploadWorkHoursRequest();
        uploadWorkHoursRequest.working_hours = [];
        uploadWorkHoursRequest.username = this.username;

        this.workHours.forEach(editedWorkHour => {
            const workHour = new WorkingHours();
            workHour.day_of_week_id = editedWorkHour.day_of_week_id;

            const editedWorkHourEndTime = editedWorkHour.end_time?.split(':');
            const editedWorkHourStartTime = editedWorkHour.start_time?.split(':');

            if (!editedWorkHourEndTime || !editedWorkHourStartTime) {
                workHour.end_time_hour = workHour.end_time_minutes = null;
                workHour.start_time_hour = workHour.start_time_minutes = null;
            } else {
                workHour.end_time_hour = parseInt(editedWorkHourEndTime[0], 10);
                workHour.end_time_minutes = parseInt(editedWorkHourEndTime[1], 10);

                workHour.start_time_hour = parseInt(editedWorkHourStartTime[0], 10);
                workHour.start_time_minutes = parseInt(editedWorkHourStartTime[1], 10);
            }

            uploadWorkHoursRequest.working_hours.push(workHour);
        });

        this.bhClient.uploadWorkHours([uploadWorkHoursRequest]).subscribe(
            () => {
                this.isUploadWorkHoursSuccessful = true;
            },
            error => {
                this.isUploadWorkHoursFailure = true;
                this.vhoWorkHoursTableComponent.isEditing = true;
                this.logger.error(`${this.loggerPrefix} Working hours could not be saved`, error, { workHours: this.workHours });
            }
        );
    }

    setSearchResult($event: SearchResults) {
        this.result = $event.result;
        this.showWorkHoursTable = false;
        this.showNonWorkHoursTable = false;
        switch (this.hoursType) {
            case HoursType.WorkingHours:
                this.showWorkHoursTable = true;
                break;
            case HoursType.NonWorkingHours:
                this.result = this.filterByFutureDate(this.result as VhoNonAvailabilityWorkHoursResponse[]);
                this.showNonWorkHoursTable = true;
                break;
        }

        if (!$event.refresh) {
            this.clearConfirmationMessagesForSaveNonWorkHours();
            this.clearConfirmationMessagesForSaveWorkHours();
        }
    }

    setHoursType($event: HoursType) {
        this.hoursType = $event;
    }

    setUsername($event: string) {
        this.username = $event;
    }

    onSaveNonWorkHours($event: EditVhoNonAvailabilityWorkHoursModel[]) {
        this.nonWorkHours = $event;
        this.saveNonWorkHours();
    }

    saveNonWorkHours() {
        this.isUploadNonWorkHoursSuccessful = false;

        const username = this.username;
        const updateNonWorkHoursRequest = new UpdateNonWorkingHoursRequest();
        const hours: NonWorkingHours[] = [];

        this.nonWorkHours.forEach(editedNonWorkHour => {
            const nonWorkHour = new NonWorkingHours();

            nonWorkHour.id = editedNonWorkHour.id;
            nonWorkHour.start_time = this.combineDateAndTime(editedNonWorkHour.start_date, editedNonWorkHour.start_time);
            nonWorkHour.end_time = this.combineDateAndTime(editedNonWorkHour.end_date, editedNonWorkHour.end_time);

            hours.push(nonWorkHour);
        });

        updateNonWorkHoursRequest.hours = hours;

        this.bhClient.updateNonAvailabilityWorkHours(username, updateNonWorkHoursRequest).subscribe(
            () => {
                this.showSaveNonWorkHoursFailedPopup = false;
                this.isUploadNonWorkHoursSuccessful = true;
                this.saveNonWorkHoursCompleted$.next(true);
            },
            error => {
                this.showSaveNonWorkHoursFailedPopup = true;
                this.logger.error(`${this.loggerPrefix} Non working hours could not be saved`, error, { nonWorkHours: this.nonWorkHours });
                this.saveNonWorkHoursCompleted$.next(false);
            }
        );
    }

    cancelSaveNonWorkHours() {
        this.showSaveNonWorkHoursFailedPopup = false;
    }

    combineDateAndTime(date: string, time: string) {
        return CombineDateAndTime(date, time);
    }

    onEditNonWorkHours() {
        this.clearConfirmationMessagesForSaveNonWorkHours();
    }

    onCancelSaveNonWorkHours() {
        this.clearConfirmationMessagesForSaveNonWorkHours();
    }

    onEditWorkHours() {
        this.clearConfirmationMessagesForSaveWorkHours();
    }

    onCancelSaveWorkHours() {
        this.clearConfirmationMessagesForSaveWorkHours();
    }

    clearConfirmationMessagesForSaveNonWorkHours() {
        this.showSaveNonWorkHoursFailedPopup = false;
        this.isUploadNonWorkHoursSuccessful = false;
    }

    clearConfirmationMessagesForSaveWorkHours() {
        this.isUploadWorkHoursFailure = false;
        this.isUploadWorkHoursSuccessful = false;
    }

    dataChanged($event: boolean) {
        this.dataChange.emit($event);
    }
    public filterByFutureDate(value: VhoNonAvailabilityWorkHoursResponse[]) {
        return value.filter(d => d.start_time >= this.todayDate);
    }
}
