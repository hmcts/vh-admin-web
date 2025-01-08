import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import { Observable, ReplaySubject, Subject, timer } from 'rxjs';
import { retry, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ConnectionServiceConfigToken, ConnectionServiceConfig } from './connection';

@Injectable({
    providedIn: 'root'
})
export class ConnectionService implements OnDestroy {
    private readonly defaults: ConnectionServiceConfig = {
        url: '/assets/images/favicons/favicon.ico?_:' + new Date().getTime(),
        interval: 10000,
        retryInterval: 1000,
        maxRetryAttempts: 3
    };
    private readonly config: ConnectionServiceConfig;
    private unsubscribe$: Subject<boolean> = null;

    hasConnection$ = new ReplaySubject<boolean>();

    constructor(
        private readonly http: HttpClient,
        @Inject(ConnectionServiceConfigToken) @Optional() config: ConnectionServiceConfig
    ) {
        this.config = { ...this.defaults, ...config };
        this.startTimer();
    }

    checkConnection(restartTimerOnSuccess = false): Observable<any> {
        return this.http.head(this.config.url, { responseType: 'text' }).pipe(
            retry({
                count: this.config.maxRetryAttempts,
                delay: this.config.retryInterval,
                resetOnSuccess: restartTimerOnSuccess
            }),
            tap(() => {
                if (restartTimerOnSuccess) {
                    this.startTimer();
                }
            })
        );
    }

    ngOnDestroy() {
        this.unsubscribe();
    }

    private startTimer() {
        this.unsubscribe();
        this.unsubscribe$ = new Subject();

        timer(0, this.config.interval)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap(() => this.checkConnection())
            )
            .subscribe({
                next: () => this.hasConnection$.next(true),
                error: () => {
                    this.hasConnection$.next(false);
                    this.unsubscribe();
                }
            });
    }

    private unsubscribe() {
        if (this.unsubscribe$ !== null) {
            this.unsubscribe$.next(true);
            this.unsubscribe$.complete();
            this.unsubscribe$ = null;
        }
    }
}
