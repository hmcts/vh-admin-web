import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoadingSpinnerService {
    loading$: Observable<boolean>;

    private currentRequests = 0;
    private _loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    public constructor() {
        this.loading$ = this._loading$.asObservable();
    }

    requestStarted() {
        this.currentRequests += 1;
        this.updateSpinner();
    }

    requestEnded() {
        this.currentRequests -= 1;
        this.updateSpinner();
    }

    private updateSpinner() {
        this._loading$.next(this.currentRequests > 0);
    }
}
