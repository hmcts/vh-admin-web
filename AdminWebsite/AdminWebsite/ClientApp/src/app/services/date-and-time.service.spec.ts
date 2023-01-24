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
        it('should correctly parse 520 minutes to 8 hours and 40', () => {
            const result = service.minutesToHours(520);
            expect(result).toEqual({ hours: 8, minutes: 40 });
        });
        it('should correctly parse 120 minutes to 2 hours and 0', () => {
            const result = service.minutesToHours(120);
            expect(result).toEqual({ hours: 2, minutes: 0 });
        });
    });
});
