import { BookingsDetailsModel } from './bookings-list.model';

describe('BookingsDetailsModel', () => {
  it('should be able to set minutes to hours, minutes less than hour', () => {
    const model = new BookingsDetailsModel('1', new Date(), 45, "", "", "", "", "", "", "", new Date(), "", new Date());
    expect(model.DurationInHoursAndMinutes).toEqual('45 minutes');
  });

  it('should be able to set minutes to hours, minutes more than 2 hours', () => {
    const model = new BookingsDetailsModel('1', new Date(), 145, "", "", "", "", "", "", "", new Date(), "", new Date());
    expect(model.DurationInHoursAndMinutes).toEqual('2 hours 25 minutes');
  });

  it('should be able to set minutes to hours, minutes more than 1 hour', () => {
    const model = new BookingsDetailsModel('1', new Date(), 75, "", "", "", "", "", "", "", new Date(), "", new Date());
    expect(model.DurationInHoursAndMinutes).toEqual('1 hour 15 minutes');
  });
  it('should be able to set minutes to hours, duration has only hours', () => {
    const model = new BookingsDetailsModel('1', new Date(), 60, "", "", "", "", "", "", "", new Date(), "", new Date());
    expect(model.DurationInHoursAndMinutes).toEqual('1 hour');
  });
});
