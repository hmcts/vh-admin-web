import { BookingsDetailsModel } from './bookings-list.model';

describe('BookingsDetailsModel', () => {
    it('should format duration humanly readable', () => {
        const model = new BookingsDetailsModel(
            '',
            new Date(),
            145,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            new Date(),
            '',
            new Date(),
            '',
            new Date(),
            'Cancelled',
            false,
            true,
            'reason',
            'Financial Remedy',
            '',
            '1234567'
        );
        expect(model.DurationInHoursAndMinutes).toBe('2 hours 25 minutes');
    });
});
