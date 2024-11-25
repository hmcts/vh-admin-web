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
            new Date(),
            '',
            new Date(),
            '',
            new Date(),
            'Cancelled',
            true,
            'reason',
            'Financial Remedy',
            '',
            '1234567'
        );
        expect(model.DurationInHoursAndMinutes).toBe('2 hours 25 minutes');
    });
    describe('isMultiDay', () => {
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
            new Date(),
            '',
            new Date(),
            '',
            new Date(),
            'Cancelled',
            true,
            'reason',
            'Financial Remedy',
            '',
            '1234567'
        );
        it('should return true when GroupId is not null', () => {
            model.GroupId = '123';
            expect(model.isMultiDay).toBe(true);
        });
        it('should return false when GroupId is null', () => {
            model.GroupId = null;
            expect(model.isMultiDay).toBe(false);
        });
    });
    describe('isLastDayOfMultiDayHearing', () => {
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
            new Date(),
            '',
            new Date(),
            '',
            new Date(),
            'Cancelled',
            true,
            'reason',
            'Financial Remedy',
            '',
            '1234567'
        );
        it('should return true when StartTime equals MultiDayHearingLastDayScheduledDateTime', () => {
            const date = new Date();
            model.MultiDayHearingLastDayScheduledDateTime = date;
            model.StartTime = date;
            expect(model.isLastDayOfMultiDayHearing).toBe(true);
        });
        it('should return false when StartTime does not equal MultiDayHearingLastDayScheduledDateTime', () => {
            const date = new Date();
            model.MultiDayHearingLastDayScheduledDateTime.setDate(date.getDate() + 1);
            model.StartTime = date;
            expect(model.isLastDayOfMultiDayHearing).toBe(false);
        });
        it('should return false when MultiDayHearingLastDayScheduledDateTime is null', () => {
            const date = new Date();
            model.MultiDayHearingLastDayScheduledDateTime = null;
            model.StartTime = date;
            expect(model.isLastDayOfMultiDayHearing).toBe(false);
        });
    });
});
