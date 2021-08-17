import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-date-error-messages',
    templateUrl: './date-error-messages.html'
})
export class DateErrorMessagesComponent {
    @Input() required: boolean;
    @Input() weekend: boolean;
    @Input() publicHoliday: boolean;
    @Input() pastDate: boolean;
}
