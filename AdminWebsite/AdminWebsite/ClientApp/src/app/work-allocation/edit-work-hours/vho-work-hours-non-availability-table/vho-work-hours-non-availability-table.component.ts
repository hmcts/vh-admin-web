import { Component, Input, OnInit } from '@angular/core';
import { BHClient, VhoNonAvailabilityWorkHoursResponse } from '../../../services/clients/api-client';
import { faTrash, faCalendarPlus, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Logger } from '../../../services/logger';

@Component({
    selector: 'app-vho-work-hours-non-availability-table',
    templateUrl: './vho-work-hours-non-availability-table.component.html'
})
export class VhoWorkHoursNonAvailabilityTableComponent implements OnInit {
    loggerPrefix = '[WorkHoursNonAvailabilityTable] -';
    nonWorkHours: VhoNonAvailabilityWorkHoursResponse[];
    faTrash = faTrash;
    faCalendarPlus = faCalendarPlus;
    faExclamation = faCircleExclamation;
    timeMessageDuration = 4000;

    displayConfirmPopup = false;
    slotToDelete: VhoNonAvailabilityWorkHoursResponse;
    displayMessage = false;

    @Input() set result(value) {
        if (value && value[0] instanceof VhoNonAvailabilityWorkHoursResponse) {
            this.nonWorkHours = value;
        } else {
            this.nonWorkHours = null;
        }
    }
    @Input() userName: string;
    message: string;

    constructor(private bhClient: BHClient, private logger: Logger) {}

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
    }

    delete(slot: VhoNonAvailabilityWorkHoursResponse) {
        this.logger.info(`${this.loggerPrefix} Non Working hours confirmation to delete`);
        this.displayConfirmPopup = true;
        this.slotToDelete = slot;
    }

    onDeletionAnswer($event: boolean) {
        this.displayConfirmPopup = false;
        if ($event) {
            this.bhClient.deleteNonAvailabilityWorkHours(this.slotToDelete.id).subscribe(
                res => {
                    this.logger.info(`${this.loggerPrefix} Non Working hours deleted`);
                    this.displayMessageAndFade('Non-availability hours changes saved succesfully');
                    this.removeSlot();
                },
                error => {
                    this.logger.error(`${this.loggerPrefix} Working hours could not be saved`, error);
                    this.displayMessageAndFade('Non-availability hours changes could not be saved succesfully');
                }
            );
        }
    }

    displayMessageAndFade(message: string) {
        this.displayMessage = true;
        this.message = message;
        this.fadeOutLink();
    }

    fadeOutLink() {
        setTimeout(() => {
            this.displayMessage = false;
        }, this.timeMessageDuration);
    }

    private removeSlot() {
        const slot = this.nonWorkHours.find(x => x.id === this.slotToDelete.id);
        const idx = this.nonWorkHours.indexOf(slot);
        this.nonWorkHours.splice(idx, 1);
    }
}
