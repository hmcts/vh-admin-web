import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, switchMap, takeUntil, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ConnectionService {
    constructor(private http: HttpClient) {
        this.startTimer();
    }

    private url = '/assets/images/favicons/favicon.ico?_=' + new Date().getTime();
    private method = 'head';
    private interval = 10000;
    private retryInterval = 1000;
    private maxRetryAttempts = 3;
    private unsubscribe$: Subject<boolean> = null;

    private startTimer() {
        this.unsubscribe();
        this.unsubscribe$ = new Subject();

        timer(0, this.interval)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap(() => this.checkConnection()),
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

    hasConnection$ = new ReplaySubject<boolean>();

    checkConnection(restartTimerOnSuccess = false): Observable<any> {
        return this.http[this.method](this.url, { responseType: 'text' }).pipe(
            retryWhen(
                retryStrategy({
                    maxRetryAttempts: this.maxRetryAttempts,
                    retryInterval: this.retryInterval
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
}

const retryStrategy = (config: { maxRetryAttempts?: number; retryInterval?: number }) => (errors: Observable<any>) => {
    return errors.pipe(
        mergeMap((error, i) => {
            const retryAttempt = i + 1;
            if (retryAttempt > config.maxRetryAttempts) {
                return throwError(error);
            }
            return timer(config.retryInterval);
        })
    );
};
