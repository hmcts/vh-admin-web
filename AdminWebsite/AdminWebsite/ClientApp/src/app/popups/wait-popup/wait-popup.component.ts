import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-wait-popup',
    templateUrl: './wait-popup.component.html',
    styleUrls: ['./wait-popup.component.css']
})
export class WaitPopupComponent {
    @Input()
    ConfirmationMode = false;
}
