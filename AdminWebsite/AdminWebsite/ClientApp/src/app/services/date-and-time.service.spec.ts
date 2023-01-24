import { TestBed } from '@angular/core/testing';

import { DateAndTimeService } from './date-and-time.service';

describe('DateAndTimeService', () => {
    let service: DateAndTimeService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DateAndTimeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('minutesToHours', () => {
        it('should correctly pass 520 minutes to 8 hours and 40', () => {
            const result = service.minutesToHours(520);
            expect(result).toEqual({ hours: 8, minutes: 40 });
        });
        it('should correctly pass 120 minutes to 2 hours and 0', () => {
            const result = service.minutesToHours(120);
            expect(result).toEqual({ hours: 2, minutes: 0 });
        });
    });

    describe('minutesToHoursDisplay', () => {
        it('should correctly display 60 minutes to "1hr"', () => {
            const result = service.minutesToHoursDisplay(60);
            expect(result).toBe('1hr');
        });
        it('should correctly display 90 minutes to "1hr 30min"', () => {
            const result = service.minutesToHoursDisplay(90);
            expect(result).toBe('1hr 30min');
        });
        it('should correctly display 145 minutes to 1hr', () => {
            const result = service.minutesToHoursDisplay(145);
            expect(result).toBe('2hrs 25min');
        });
    });
});
