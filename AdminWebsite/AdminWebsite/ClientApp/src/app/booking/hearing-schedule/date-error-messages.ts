import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
    selector: 'app-date-error-messages',
    template: ` <div *ngIf="dateCtrl.errors?.required" class="alert alert-danger">
            <span id="hearingDate-required-error" class="govuk-error-message"> Select a date </span>
        </div>
        <div *ngIf="dateCtrl.errors?.weekend || dateCtrl.errors?.publicHoliday" class="alert alert-danger">
            <span id="hearingDate-weekend-error" class="govuk-error-message">Please enter a working day (Monday to Friday) </span>
        </div>
        <div *ngIf="dateCtrl.errors?.pastdate" class="alert alert-danger">
            <span id="hearingDate-past-error" class="govuk-error-message"> Select a date in the future </span>
        </div>`
})
export class DateErrorMessagesComponent {
    @Input() dateCtrl: AbstractControl;
}
