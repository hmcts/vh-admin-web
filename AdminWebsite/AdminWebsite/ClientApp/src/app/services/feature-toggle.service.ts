import { Injectable } from '@angular/core';
import { BHClient, FeatureToggleConfiguration } from './clients/api-client';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeatureToggleService {

    constructor(private bhClient: BHClient) {}

    getStaffMemberFeatureFlag(): Observable<boolean> {
        let flag;
        this.getFeatureToggles().subscribe(f => flag = f.staff_member);
        return of(flag);
    }

    getFeatureToggles(): Observable<FeatureToggleConfiguration> {
        return this.bhClient.getFeatureToggles();
    }
}
