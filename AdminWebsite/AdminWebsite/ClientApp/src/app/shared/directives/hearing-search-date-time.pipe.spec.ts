import { HearingSearchDateTimePipe } from './hearing-search-date-time.pipe';

describe('LongDatetimePipe', () => {
    it('should return a Monday 08 April 2019, 3:45pm format', () => {
        const pipe = new HearingSearchDateTimePipe();
        const result = pipe.transform(new Date(2019, 3, 8, 15, 45).toUTCString());
        expect(result).toBe('Monday, 08-Apr-2019 - 15:45');
    });

    it('should throw an exception when an invalid input', () => {
        const pipe = new HearingSearchDateTimePipe();
        const input = 'invalid string';
        expect(() => pipe.transform(input)).toThrowError(`Invalid datetime was passed : '${input}'`);
    });

    it('should return empty string for null input', () => {
        const pipe = new HearingSearchDateTimePipe();
        const input = null;
        expect(pipe.transform(input)).toBe('');
    });
});
