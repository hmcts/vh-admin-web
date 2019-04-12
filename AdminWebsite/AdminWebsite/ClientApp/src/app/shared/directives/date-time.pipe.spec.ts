import { LongDatetimePipe } from './date-time.pipe';

describe('LongDatetimePipe', () => {

  it('should return a Monday 08 April 2019, 3:45pm format', () => {
    const pipe = new LongDatetimePipe();
    var result = pipe.transform((new Date(2019, 3, 8, 15, 45).toUTCString()));
    expect(result).toBe('Monday 08 April 2019, 3:45pm');
  });

  it('should throw an exception when an invalid input', () => {
    const pipe = new LongDatetimePipe();
    var input = 'invalid string';
    expect(() => pipe.transform(input)).toThrowError(`Invalid datetime was passed : '${input}'`);
  });

  it('should return empty string for null input', () => {
    const pipe = new LongDatetimePipe();
    var input = null;
    expect(pipe.transform(input)).toBe('');
  });

});
