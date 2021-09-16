import { Injectable } from '@angular/core';
import { BHClient, FeatureToggleConfiguration } from './clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FeatureToggleService {
    constructor(private bhClient: BHClient) {}

    getFeatureToggles(): Observable<FeatureToggleConfiguration> {
        return this.bhClient.getFeatureToggles();
    }
}
