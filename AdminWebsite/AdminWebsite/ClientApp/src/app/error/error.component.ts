import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map, startWith } from 'rxjs/operators';
import { ConnectionService } from '../services/connection/connection.service';
import { PageTrackerService } from '../services/page-tracker.service';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent {
    hasConnection$ = new Observable();
    isConnecting$ = new BehaviorSubject(false);

    constructor(private connection: ConnectionService, private router: Router, private pageTracker: PageTrackerService) {
        this.hasConnection$ = connection.hasConnection$.pipe(startWith(true));
    }

    reconnect() {
        this.isConnecting$.next(true);
        this.connection
            .checkConnection(true)
            .pipe(finalize(() => this.isConnecting$.next(false)))
            .subscribe(x => {
                const previousUrl = this.pageTracker.getPreviousUrl;
                this.router.navigate([previousUrl]);
            });
    }
}
