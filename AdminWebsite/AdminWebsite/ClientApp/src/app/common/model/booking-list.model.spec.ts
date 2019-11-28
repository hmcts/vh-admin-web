import { BookingsDetailsModel } from './bookings-list.model';

const model = new BookingsDetailsModel('', new Date(), 145, '',
  '', '', '', '', '', '',
  new Date(), '', new Date(), 'Cancelled', false, true);

describe('BookingsDetailsModel', () => {
  it('should format duration humanly readable', () => {
    expect(model.DurationInHoursAndMinutes).toBe('2 hours 25 minutes');
  });
  it('should set streaming flag to true', () => {
    expect(model.StreamingFlag).toBe(true);
  });
  it('should set Cancelled to true', () => {
    expect(model.Cancelled).toBe(true);
  });
});
