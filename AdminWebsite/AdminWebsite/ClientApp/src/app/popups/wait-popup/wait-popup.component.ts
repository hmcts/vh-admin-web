import { Component, Input } from '@angular/core';
import { LoadingSpinnerService } from 'src/app/services/loading-spinner.service';

@Component({
    selector: 'app-wait-popup',
    templateUrl: './wait-popup.component.html',
    styleUrls: ['./wait-popup.component.css']
})
export class WaitPopupComponent {
    @Input()
    ConfirmationMode = false;

    @Input()
    UseLoaderService = false;

    isLoading$ = this.spinnerService.loading$;
    constructor(public spinnerService: LoadingSpinnerService) {}
}
