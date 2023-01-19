import { TestBed, waitForAsync } from '@angular/core/testing';
import { EditWorkHoursService } from './edit-work-hours.service';
import { of, throwError } from 'rxjs';
import {BHClient, VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse} from "../../services/clients/api-client";
import {Logger} from "../../services/logger";

describe('EditWorkHoursService', () => {
    let service: EditWorkHoursService;
    let bhClientMock: jasmine.SpyObj<BHClient>;
    let loggerMock: jasmine.SpyObj<Logger>;

    beforeEach(
        waitForAsync(() => {
            bhClientMock = jasmine.createSpyObj('BHClient', ['getWorkAvailabilityHours', 'getNonAvailabilityWorkHours']);
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
    describe('searchForVho tests Work Availability', () => {
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

    describe('searchForVho tests Non Work Availability', () => {
        it('should call getWorkAvailabilityHours api and return results', async () => {
            const searchResponse: Array<VhoNonAvailabilityWorkHoursResponse> = [];
            bhClientMock.getNonAvailabilityWorkHours.and.returnValue(of(searchResponse));

            const result = await service.getNonWorkAvailabilityForVho('test.user');

            expect(result).toBeDefined();
            expect(bhClientMock.getNonAvailabilityWorkHours).toHaveBeenCalled();
            expect(result.every(e => e instanceof VhoNonAvailabilityWorkHoursResponse)).toBe(true);
            expect(result).toBe(searchResponse);
        });

        it('should call getWorkAvailabilityHours api and return null', async () => {
            bhClientMock.getNonAvailabilityWorkHours.and.returnValue(throwError({ status: 404 }));

            const result = await service.getNonWorkAvailabilityForVho('test.user');

            expect(bhClientMock.getNonAvailabilityWorkHours).toHaveBeenCalled();
            expect(loggerMock.warn).toHaveBeenCalled();
            expect(result).toBe(null);
        });

        it('should call getWorkAvailabilityHours api and throw error', async () => {
            bhClientMock.getNonAvailabilityWorkHours.and.returnValue(throwError({ status: 500 }));

            await service.getNonWorkAvailabilityForVho('test.user').catch(error => {
                expect(bhClientMock.getNonAvailabilityWorkHours).toHaveBeenCalled();
                expect(loggerMock.error).toHaveBeenCalled();
                expect(error.status).toBe(500);
            });
        });
    });
});
