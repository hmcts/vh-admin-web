import { TestBed } from '@angular/core/testing';

import { FeatureToggleService } from './feature-toggle.service';
import { BHClient, FeatureToggleConfiguration } from './clients/api-client';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';

let service: FeatureToggleService;
let clientApiSpy: jasmine.SpyObj<BHClient>;
const featureConfig = new FeatureToggleConfiguration();

describe('FeatureToggleService', () => {
    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>('BHClient', ['getFeatureToggles']);
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [{ provide: BHClient, useValue: clientApiSpy }]
        });

        service = TestBed.inject(FeatureToggleService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should return the feature config for staff member feature turned on', () => {
        featureConfig.staff_member = true;
        clientApiSpy.getFeatureToggles.and.returnValue(of(featureConfig));

        service.getFeatureToggles().subscribe(config => {
            expect(config.staff_member).toBe(featureConfig.staff_member);
        });
    });
    it('should return the feature config for staff member feature turned off', () => {
        featureConfig.staff_member = false;
        clientApiSpy.getFeatureToggles.and.returnValue(of(featureConfig));

        service.getFeatureToggles().subscribe(config => {
            expect(config.staff_member).toBe(featureConfig.staff_member);
        });
    });
});
