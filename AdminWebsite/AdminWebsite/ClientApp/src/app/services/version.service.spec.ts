import { TestBed } from '@angular/core/testing';

import { VersionService } from './version.service';
import { of } from 'rxjs';
import { AppVersionResponse, BHClient } from './clients/api-client';

describe('VersionService', () => {
    describe('VersionService', () => {
        let service: VersionService;
        let bhClientSpy: jasmine.SpyObj<BHClient>;

        beforeEach(() => {
            const spy = jasmine.createSpyObj('BHClient', ['getAppVersion']);

            TestBed.configureTestingModule({
                providers: [
                    VersionService,
                    { provide: BHClient, useValue: spy }
                ]
            });

            service = TestBed.inject(VersionService);
            bhClientSpy = TestBed.inject(BHClient) as jasmine.SpyObj<BHClient>;
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should return app version when available', () => {
            const mockVersion: AppVersionResponse = { app_version: '1.0.0', init: () => {}, toJSON: () => ({}) };
            bhClientSpy.getAppVersion.and.returnValue(of(mockVersion));

            expect(service.appVersion()).toBe('1.0.0');
        });

        it('should return "Unknown" when app version is not available', () => {
            bhClientSpy.getAppVersion.and.returnValue(of(undefined));

            expect(service.appVersion()).toBe('Unknown');
        });
    });
});
