import { MinutesToHoursPipe } from './minutes-to-hours.pipe';
import { DateAndTimeService } from '../../services/date-and-time.service';

let pipe: MinutesToHoursPipe;
beforeAll(() => {
    const dateAndTimeService = new DateAndTimeService();
    pipe = new MinutesToHoursPipe(dateAndTimeService);
});
describe('MinutesToHoursPipe', () => {
    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    describe('minutesToHoursDisplay', () => {
        it('should correctly display 60 minutes to "1hr"', () => {
            const result = pipe.transform(60);
            expect(result).toBe('1hr');
        });
        it('should correctly display 90 minutes to "1hr 30min"', () => {
            const result = pipe.transform(90);
            expect(result).toBe('1hr 30min');
        });
        it('should correctly display 145 minutes to 1hr', () => {
            const result = pipe.transform(145);
            expect(result).toBe('2hrs 25min');
        });
    });
});
