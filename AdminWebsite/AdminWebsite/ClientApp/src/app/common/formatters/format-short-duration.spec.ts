import { FormatShortDuration } from "./format-short-duration";

describe('FormatShortDuration', () => {
  it('should be able to set minutes to hours, minutes less than hour', () => {
    expect(FormatShortDuration(45)).toEqual('45 minutes');
  });

  it('should be able to set minutes to hours, minutes more than 2 hours', () => {
    expect(FormatShortDuration(145)).toEqual('2 hours 25 minutes');
  });

  it('should be able to set minutes to hours, minutes more than 1 hour', () => {
    expect(FormatShortDuration(75)).toEqual('1 hour 15 minutes');
  });

  it('should be able to set minutes to hours, duration has only hours', () => {
    expect(FormatShortDuration(60)).toEqual('1 hour');
  });

  it('should format single minute in singular', () => {
    expect(FormatShortDuration(61)).toEqual('1 hour 1 minute');
  });

  it('should format single minute in singular without hour', () => {
    expect(FormatShortDuration(1)).toEqual('1 minute');
  });

  it('should format time as empty dash if zero', () => {
    expect(FormatShortDuration(0)).toEqual('-');
  });

  it('should throw error on invalid duration', () => {
    expect(() => FormatShortDuration(null)).toThrowError("Invalid duration: 'null'")
  });

  it('should throw error on negative duration', () => {
    expect(() => FormatShortDuration(-1)).toThrowError("Invalid duration: '-1'")
  });
})
