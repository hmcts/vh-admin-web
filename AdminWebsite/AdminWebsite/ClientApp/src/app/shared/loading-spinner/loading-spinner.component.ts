import { Component } from '@angular/core';
import { LoadingSpinnerService } from 'src/app/services/loading-spinner.service';

@Component({
    selector: 'app-loading-spinner',
    templateUrl: './loading-spinner.component.html',
    styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
    isLoading$ = this.spinnerService.loading$;
    constructor(public spinnerService: LoadingSpinnerService) {}
}
