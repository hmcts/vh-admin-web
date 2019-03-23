import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking.service';

describe('booking service', () => {
  let service: BookingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingService]
    });

    service = TestBed.get(BookingService);
    const mockSessionStorage = {
      getItem: (key: string): string => {
        return 'true';
      },
      setItem: (key: string, value: string) => {
      },
      removeItem: (key: string) => {
      },
      clear: () => {
      }
    };
    spyOn(sessionStorage, 'getItem')
      .and.callFake(mockSessionStorage.getItem);
    spyOn(sessionStorage, 'setItem')
      .and.callFake(mockSessionStorage.setItem);
    spyOn(sessionStorage, 'removeItem')
      .and.callFake(mockSessionStorage.removeItem);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should set edit mode for new booking', () => {
    service.setEditMode();
    expect(sessionStorage.setItem).toHaveBeenCalled();
  });
 
  it('should reset edit mode ', () => {
    service.resetEditMode();
    expect(sessionStorage.removeItem).toHaveBeenCalled();
  });
  it('should get edit mode for new booking', () => {
    const editMode = service.isEditMode();
    expect(editMode).toBeFalsy();
    expect(sessionStorage.getItem).toHaveBeenCalled();
  });
  it('should set participant email in storage', () => {
    service.setParticipantEmail('some@emai.toset');
    expect(sessionStorage.setItem).toHaveBeenCalled();
  });
  it('should get participant email from storage', () => {
    service.getParticipantEmail();
    expect(sessionStorage.getItem).toHaveBeenCalled();
  });
  it('should remove participant email from storage', () => {
    service.removeParticipantEmail();
    expect(sessionStorage.removeItem).toHaveBeenCalled();
  });
});
