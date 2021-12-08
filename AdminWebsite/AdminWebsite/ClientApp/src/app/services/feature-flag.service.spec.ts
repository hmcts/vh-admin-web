import { TestBed } from '@angular/core/testing';

import { FeatureFlagService } from './feature-flag.service';
import { BHClient } from './clients/api-client';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';

let service: FeatureFlagService;
let clientApiSpy: jasmine.SpyObj<BHClient>;
describe('FeatureFlagService', () => {
    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>('BHClient', ['getFeatureFlag']);
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [{ provide: BHClient, useValue: clientApiSpy }]
        });

        service = TestBed.inject(FeatureFlagService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should return the feature config for staff member feature turned on', () => {
        clientApiSpy.getFeatureFlag.and.returnValue(of(true));

        service.getFeatureFlagByName('StaffMemberFeature').subscribe(result => {
            expect(result).toBeTruthy();
        });
    });
    it('should return the feature config for staff member feature turned off', () => {
        clientApiSpy.getFeatureFlag.and.returnValue(of(false));

        service.getFeatureFlagByName('StaffMemberFeature').subscribe(result => {
            expect(result).toBeFalsy();
        });
    });
});
