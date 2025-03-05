import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-date-error-messages',
    templateUrl: './date-error-messages.html',
    standalone: false
})
export class DateErrorMessagesComponent {
    @Input() required: boolean;
    @Input() pastDate: boolean;
}
