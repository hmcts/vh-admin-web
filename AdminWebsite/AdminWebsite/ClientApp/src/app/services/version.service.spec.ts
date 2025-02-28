import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { VersionService } from './version.service';
import { of } from 'rxjs';
import { AppVersionResponse, BHClient } from './clients/api-client';

describe('VersionService', () => {
    let service: VersionService;
    let bhClientSpy: jasmine.SpyObj<BHClient>;

    beforeEach(() => {
        bhClientSpy = jasmine.createSpyObj('BHClient', ['getAppVersion']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [VersionService, { provide: BHClient, useValue: bhClientSpy }]
        });

        service = new VersionService(bhClientSpy);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call getAppVersion and return the version', async () => {
        const mockVersion: AppVersionResponse = { app_version: '1.0.0', init: () => {}, toJSON: () => ({}) };
        bhClientSpy.getAppVersion.and.returnValue(of(mockVersion));

        service.version$?.subscribe(version => {
            expect(version).toEqual(mockVersion);
        });

        expect(bhClientSpy.getAppVersion.calls.count()).toBe(1);
    });
});
