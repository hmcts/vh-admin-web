import { Injectable } from '@angular/core';
import { BHClient } from './clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FeatureFlagService {
    constructor(private bhClient: BHClient) {}

    getFeatureFlagByName(featureName: string): Observable<boolean> {
        return this.bhClient.getFeatureFlag(featureName);
    }
}
