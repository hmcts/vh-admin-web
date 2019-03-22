import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { VideoHearingsService } from './video-hearings.service';
import {
  HearingTypeResponse, BHClient, BookNewHearingRequest, HearingDetailsResponse,
  CaseAndHearingRolesResponse, CaseRequest, ParticipantRequest
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';
import { CaseModel } from '../common/model/case.model';

let clientApiSpy: jasmine.SpyObj<BHClient>;

describe('Hearing Request Storage', () => {
  const newRequestKey = 'bh-newRequest';
  clientApiSpy = jasmine.createSpyObj('BHClient',
    ['getHearingTypes', 'getParticipantRoles', 'bookNewHearing']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [VideoHearingsService, { provide: BHClient, useValue: clientApiSpy }]
    });

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

  it('should create new hearing when persistence storage is empty', inject([VideoHearingsService], (service: VideoHearingsService) => {
    const currentRequest = service.getCurrentRequest();
    const cachedRequest = sessionStorage.getItem(newRequestKey);
    expect(currentRequest).toBeDefined();
    expect(cachedRequest).toBeTruthy();
  }));

  it('should persist hearing request on update and remove on cancellation',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      const currentRequest = service.getCurrentRequest();
      service.updateHearingRequest(currentRequest);
      let cachedRequest = sessionStorage.getItem(newRequestKey);
      expect(cachedRequest).toBeDefined();
      service.cancelRequest();
      cachedRequest = sessionStorage.getItem(newRequestKey);
      expect(cachedRequest).toBeTruthy();
    }));

  it('should return true if  booking has unsaved changes',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      expect(service.hasUnsavedChanges()).toBeTruthy();
    }));
  it('should save bookingHasChangesKey in the session storage',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      service.onBookingChange(true);
      expect(sessionStorage.setItem).toHaveBeenCalled();
    }));
  it('should remove bookingHasChangesKey from the session storage',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      service.onBookingChange(false);
      expect(sessionStorage.removeItem).toHaveBeenCalled();
    }));
  it('should get hearings types',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      service.getHearingTypes();
      expect(clientApiSpy.getHearingTypes).toHaveBeenCalled();
    }));
  it('should returns invalid hearing request',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      const currentRequest = service.validCurrentRequest();
      expect(currentRequest).toBeFalsy();
    }));
  it('should update hearing request in the storage',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      service.updateHearingRequest(new HearingModel());
      expect(sessionStorage.setItem).toHaveBeenCalled();
    }));
  it('should get participants roles',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      service.getParticipantRoles('Defendant');
      expect(clientApiSpy.getParticipantRoles).toHaveBeenCalled();
    }));
  it('should cancel hearing request and remove from storage',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      service.cancelRequest();
      expect(sessionStorage.removeItem).toHaveBeenCalledTimes(2);
    }));
  it('should save hearing request in database',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      const date = Date.now();
      const caseModel = new CaseModel();
      caseModel.name = 'case1';
      caseModel.number = 'Number 1';
      const model = new HearingModel();
      model.case_type = 'Tax';
      model.hearing_type_name = 'hearing type';
      model.scheduled_date_time = new Date(date);
      model.scheduled_duration = 30;
      model.court_name = 'court address';
      model.court_room = 'room 09';
      model.other_information = 'note';
      model.cases = [caseModel];
      model.participants = [];

      service.saveHearing(model);
      expect(clientApiSpy.bookNewHearing).toHaveBeenCalled();
    }));
  it('should map hearing request',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      const date = Date.now();
      const caseModel = new CaseModel();
      caseModel.name = 'case1';
      caseModel.number = 'Number 1';
      const model = new HearingModel();
      model.case_type = 'Tax';
      model.hearing_type_name = 'hearing type';
      model.scheduled_date_time = new Date(date);
      model.scheduled_duration = 30;
      model.court_name = 'court address';
      model.court_room = 'room 09';
      model.other_information = 'note';
      model.cases = [caseModel];
      model.participants = [];

      const request = service.mapHearing(model);

      expect(request.case_type_name).toBe('Tax');
      expect(request.hearing_room_name).toBe('room 09');
      expect(request.hearing_venue_name).toBe('court address');
      expect(request.other_information).toBe('note');
      expect(request.case_type_name).toBe('Tax');
      expect(request.cases).toBeTruthy();
      expect(request.cases[0].name).toBe('case1');
      expect(request.cases[0].number).toBe('Number 1');
      expect(request.scheduled_date_time).toEqual(new Date(date));
      expect(request.scheduled_duration).toBe(30);
    }));
});
