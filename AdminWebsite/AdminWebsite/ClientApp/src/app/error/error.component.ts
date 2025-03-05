import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ConnectionService } from '../services/connection/connection.service';
import { PageTrackerService } from '../services/page-tracker.service';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    standalone: false
})
export class ErrorComponent {
    hasConnection$ = new Observable();
    isConnecting$ = new BehaviorSubject(false);

    constructor(
        private readonly connection: ConnectionService,
        private readonly router: Router,
        private readonly pageTracker: PageTrackerService
    ) {
        this.hasConnection$ = connection.hasConnection$;
    }

    reconnect() {
        this.isConnecting$.next(true);
        this.connection
            .checkConnection(true)
            .pipe(finalize(() => this.isConnecting$.next(false)))
            .subscribe(() => {
                const previousUrl = this.pageTracker.getPreviousUrl();
                this.router.navigate([previousUrl]);
            });
    }
}
