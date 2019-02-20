import { BookingsListModule } from './bookings-list.module';

describe('BookingsListModule', () => {
  let bookingsListModule: BookingsListModule;

  beforeEach(() => {
    bookingsListModule = new BookingsListModule();
  });

  it('should create an instance', () => {
    expect(bookingsListModule).toBeTruthy();
  });
});