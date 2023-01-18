import { TestBed } from '@angular/core/testing';

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
            bHClientSpy.getAllocationHearings.and.returnValue(throwError(new Error()));
            const result = service.getAllocationHearings(null, null, null, null, null, null);
            expect(bHClientSpy.getAllocationHearings).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toEqual(of([]));
        });

        it('Should return results', () => {
            bHClientSpy.getAllocationHearings.and.returnValue(of([new AllocationHearingsResponse()]));
            const result = service.getAllocationHearings(null, null, null, null, null, null);
            expect(bHClientSpy.getAllocationHearings).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
            expect(result).toEqual(of([new AllocationHearingsResponse()]));
        });
    });
});
