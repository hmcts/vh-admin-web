import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { AllocateHearingsService } from './allocate-hearings.service';
import { of } from 'rxjs';
import { AllocationHearingsResponse, BHClient, UpdateHearingAllocationToCsoRequest } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { newGuid } from '@microsoft/applicationinsights-core-js';

describe('AllocateHearingsService', () => {
    let service: AllocateHearingsService;
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let logger: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        bHClientSpy = jasmine.createSpyObj('BHClient', ['getAllocationHearings', 'allocateHearingsToCso']);
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
            service.getAllocationHearings(null, null, null, null, null, null);
            expect(bHClientSpy.getAllocationHearings).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });

        it('Should return results', () => {
            const allocationResponse = [
                new AllocationHearingsResponse({
                    allocated_cso: 'test_user1',
                    hearing_id: 'hearing_id_value1',
                    start_time: 'start_time1',
                    case_type: 'case_type1',
                    case_number: 'case_number1',
                    duration: 480,
                    hearing_date: new Date('2023-01-01')
                }),
                new AllocationHearingsResponse({
                    allocated_cso: 'test_user2',
                    hearing_id: 'hearing_id_value2',
                    start_time: 'start_time2',
                    case_type: 'case_type1',
                    case_number: 'case_number2',
                    duration: 360,
                    hearing_date: new Date('2023-01-02')
                })
            ];

            bHClientSpy.getAllocationHearings.and.returnValue(of(allocationResponse));
            let result;
            service.getAllocationHearings(null, null, null, null, null, null).subscribe(e => (result = e));
            expect(bHClientSpy.getAllocationHearings).toHaveBeenCalled();
            expect(result).toEqual(allocationResponse);
        });
    });

    describe('allocateCsoToHearings', () => {
        it('should call the api and return updated hearings with allocated users', fakeAsync(() => {
            const csoId = newGuid();
            const csoUsername = 'test@cso.com';
            const allocationResponse = [
                new AllocationHearingsResponse({
                    allocated_cso: csoUsername,
                    hearing_id: newGuid(),
                    start_time: 'start_time1',
                    case_type: 'case_type1',
                    case_number: 'case_number1',
                    duration: 480,
                    hearing_date: new Date('2023-01-01')
                }),
                new AllocationHearingsResponse({
                    allocated_cso: csoUsername,
                    hearing_id: newGuid(),
                    start_time: 'start_time2',
                    case_type: 'case_type1',
                    case_number: 'case_number2',
                    duration: 360,
                    hearing_date: new Date('2023-01-02')
                }),
                new AllocationHearingsResponse({
                    allocated_cso: csoUsername,
                    hearing_id: newGuid(),
                    start_time: 'start_time2',
                    case_type: 'case_type1',
                    case_number: 'case_number2',
                    duration: 360,
                    hearing_date: new Date('2023-01-02')
                })
            ];

            const selectedHearingIds = [
                allocationResponse[0].hearing_id,
                allocationResponse[1].hearing_id,
                allocationResponse[2].hearing_id
            ];

            bHClientSpy.allocateHearingsToCso.and.returnValue(of(allocationResponse));

            const request = new UpdateHearingAllocationToCsoRequest({
                cso_id: csoId,
                hearings: selectedHearingIds
            });
            let result: AllocationHearingsResponse[];
            service.allocateCsoToHearings(selectedHearingIds, csoId).subscribe(response => (result = response));
            tick();

            expect(bHClientSpy.allocateHearingsToCso).toHaveBeenCalledWith(request);
            expect(result.every(x => x.allocated_cso === csoUsername)).toBeTruthy();
        }));
    });
});
