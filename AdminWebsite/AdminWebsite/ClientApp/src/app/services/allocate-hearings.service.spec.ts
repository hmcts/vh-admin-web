import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { AllocateHearingsService } from './allocate-hearings.service';
import { AllocationHearingsResponse, BHClient } from './clients/api-client';
import { Logger } from './logger';
import { of, throwError } from 'rxjs';

describe('AllocateHearingsService', () => {
    let service: AllocateHearingsService;
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let logger: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        bHClientSpy = jasmine.createSpyObj('BHClient', ['getAllocationHearings']);
        logger = jasmine.createSpyObj('Logger', ['error']);
        TestBed.configureTestingModule({
            providers: [
                { provide: BHClient, useValue: bHClientSpy },
                { provide: Logger, useValue: logger }
            ]
        });
        service = TestBed.inject(AllocateHearingsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getAllocationHearings', () => {
        it('Should attempt to retrieve unallocated hearings, and throw error', () => {
            bHClientSpy.getAllocationHearings.and.throwError('404');
            const result = service.getAllocationHearings(null, null, null, null, null, null);
            expect(bHClientSpy.getAllocationHearings).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });

        it('Should return results', () => {
            const allocationResponse = [new AllocationHearingsResponse()];
            bHClientSpy.getAllocationHearings.and.returnValue(of(allocationResponse));
            let result;
            service.getAllocationHearings(null, null, null, null, null, null).subscribe(e => (result = e));
            expect(bHClientSpy.getAllocationHearings).toHaveBeenCalled();
            expect(result).toEqual(allocationResponse);
        });
    });
});
