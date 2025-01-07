import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormArray } from '@angular/forms';
import { VHBooking } from 'src/app/common/model/vh-booking';

@Component({
    selector: 'app-edit-hearing-dates',
    templateUrl: './edit-hearing-dates.component.html'
})
export class EditHearingDatesComponent {
    @Input() hearingsInGroupToEdit: VHBooking[];
    @Input() newDatesFormArray: FormArray;

    today = new Date();

    constructor(private readonly datePipe: DatePipe) {}

    get newDatesInvalid() {
        return this.newDatesFormArray.invalid && (this.newDatesFormArray.dirty || this.newDatesFormArray.touched);
    }

    get areNewDatesUnique() {
        return !this.newDatesFormArray.errors?.nonUniqueDates;
    }

    formatDate(date: Date): string {
        return this.datePipe.transform(date, 'dd/MM/yyyy');
    }
}
