import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormArray } from '@angular/forms';
import { HearingModel } from 'src/app/common/model/hearing.model';

@Component({
    selector: 'app-edit-hearing-dates',
    templateUrl: './edit-hearing-dates.component.html'
})
export class EditHearingDatesComponent {
    @Input() hearingsInGroupToEdit: HearingModel[];
    @Input() newDatesFormArray: FormArray;

    today = new Date();

    constructor(private datePipe: DatePipe) {}

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
