import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import { Observable, ReplaySubject, Subject, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ConnectionServiceConfigToken, ConnectionServiceConfig } from './connection';

@Injectable({
    providedIn: 'root'
})
export class ConnectionService implements OnDestroy {
    private defaults: ConnectionServiceConfig = {
        url: '/assets/images/favicons/favicon.ico?_:' + new Date().getTime(),
        interval: 10000,
        retryInterval: 1000,
        maxRetryAttempts: 3
    };
    private config: ConnectionServiceConfig;
    private unsubscribe$: Subject<boolean> = null;

    hasConnection$ = new ReplaySubject<boolean>();

    constructor(private http: HttpClient, @Inject(ConnectionServiceConfigToken) @Optional() config: ConnectionServiceConfig) {
        this.config = { ...this.defaults, ...config };
        this.startTimer();
    }

    checkConnection(restartTimerOnSuccess = false): Observable<any> {
        return this.http.head(this.config.url, { responseType: 'text' }).pipe(
            retryWhen(
                retryStrategy({
                    maxRetryAttempts: this.config.maxRetryAttempts,
                    retryInterval: this.config.retryInterval
                })
            ),
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
            .subscribe(
                () => {
                    this.hasConnection$.next(true);
                },
                () => {
                    this.hasConnection$.next(false);
                    this.unsubscribe();
                }
            );
    }

    private unsubscribe() {
        if (this.unsubscribe$ !== null) {
            this.unsubscribe$.next();
            this.unsubscribe$.complete();
            this.unsubscribe$ = null;
        }
    }
}

const retryStrategy = (config: { maxRetryAttempts?: number; retryInterval?: number }) => (errors: Observable<any>) =>
    errors.pipe(
        mergeMap((error, i) => {
            const retryAttempt = i + 1;
            if (retryAttempt > config.maxRetryAttempts) {
                return throwError(error);
            }
            return timer(config.retryInterval);
        })
    );
