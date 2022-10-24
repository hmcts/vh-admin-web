import { TestBed, waitForAsync } from '@angular/core/testing';
import { EditWorkHoursService } from './edit-work-hours.service';
import { BHClient, VhoWorkHoursResponse } from './clients/api-client';
import { Logger } from './logger';
import { of, throwError } from 'rxjs';

describe('EditWorkHoursService', () => {
    let service: EditWorkHoursService;
    let bhClientMock: jasmine.SpyObj<BHClient>;
    let loggerMock: jasmine.SpyObj<Logger>;

    beforeEach(
        waitForAsync(() => {
            bhClientMock = jasmine.createSpyObj('BHClient', ['getWorkAvailabilityHours']);
            loggerMock = jasmine.createSpyObj<Logger>(['warn', 'error']);
            TestBed.configureTestingModule({
                providers: [
                    { provide: BHClient, useValue: bhClientMock },
                    { provide: Logger, useValue: loggerMock }
                ]
            });
            service = TestBed.inject(EditWorkHoursService);
        })
    );

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    describe('searchForVho tests', () => {
        it('should call getWorkAvailabilityHours api and return results', async () => {
            const searchResponse: Array<VhoWorkHoursResponse> = [];
            bhClientMock.getWorkAvailabilityHours.and.returnValue(of(searchResponse));

            const result = await service.getWorkAvailabilityForVho('test.user');

            expect(result).toBeDefined();
            expect(bhClientMock.getWorkAvailabilityHours).toHaveBeenCalled();
            expect(result.every(e => e instanceof VhoWorkHoursResponse)).toBe(true);
            expect(result).toBe(searchResponse);
        });

        it('should call getWorkAvailabilityHours api and return null', async () => {
            bhClientMock.getWorkAvailabilityHours.and.returnValue(throwError({ status: 404 }));

            const result = await service.getWorkAvailabilityForVho('test.user');

            expect(bhClientMock.getWorkAvailabilityHours).toHaveBeenCalled();
            expect(loggerMock.warn).toHaveBeenCalled();
            expect(result).toBe(null);
        });

        it('should call getWorkAvailabilityHours api and throw error', async () => {
            bhClientMock.getWorkAvailabilityHours.and.returnValue(throwError({ status: 500 }));

            await service.getWorkAvailabilityForVho('test.user').catch(error => {
                expect(bhClientMock.getWorkAvailabilityHours).toHaveBeenCalled();
                expect(loggerMock.error).toHaveBeenCalled();
                expect(error.status).toBe(500);
            });
        });
    });
});
