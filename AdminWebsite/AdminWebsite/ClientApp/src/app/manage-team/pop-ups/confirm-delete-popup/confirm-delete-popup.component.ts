import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Logger } from 'src/app/services/logger';
import { EditVhoNonAvailabilityWorkHoursModel } from '../../../work-allocation/edit-work-hours/edit-non-work-hours-model';
import { CombineDateAndTime } from '../../../common/formatters/combine-date-and-time';

@Component({
    selector: 'app-confirm-delete-hours-popup',
    templateUrl: './confirm-delete-popup.component.html'
})
export class ConfirmDeleteHoursPopupComponent implements OnInit {
    private readonly loggerPrefix = '[DeleteNonWorkingHours] -';
    @Output() deletionAnswer = new EventEmitter<boolean>();
    @Input() slotToDelete: EditVhoNonAvailabilityWorkHoursModel;
    @Input() userName: string;

    startDate: string;
    endDate: string;

    constructor(private logger: Logger) {}

    ngOnInit(): void {
        this.startDate = CombineDateAndTime(this.slotToDelete.start_date, this.slotToDelete.start_time).toDateString();
        this.endDate = CombineDateAndTime(this.slotToDelete.end_date, this.slotToDelete.end_time).toDateString();
    }

    confirmDelete() {
        this.logger.debug(`${this.loggerPrefix} Confirmed to delete hours`);
        this.deletionAnswer.emit(true);
    }

    cancelDelete() {
        this.logger.debug(`${this.loggerPrefix} Chose to not delete hours`);
        this.deletionAnswer.emit(false);
    }
}
