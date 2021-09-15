import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BHClient, FeatureToggleConfiguration } from '../services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class FeatureService {
    constructor(private bhClient: BHClient) {}

    getFeatureToggles(): Observable<FeatureToggleConfiguration> {
        return this.bhClient.getFeatureToggles();
    }
}
