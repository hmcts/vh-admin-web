import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { VideoHearingsService } from './video-hearings.service';
import {
  BHClient, HearingDetailsResponse, CaseResponse2, ParticipantResponse
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';
import { CaseModel } from '../common/model/case.model';
import { ParticipantModel } from '../common/model/participant.model';

let clientApiSpy: jasmine.SpyObj<BHClient>;

describe('Video hearing service', () => {
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

  it('should check if  booking has unsaved changes',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      service.hasUnsavedChanges();
      expect(sessionStorage.getItem).toHaveBeenCalled();
    }));
  it('should save bookingHasChangesKey in the session storage',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      service.setBookingHasChanged(true);
      expect(sessionStorage.setItem).toHaveBeenCalled();
    }));
  it('should remove bookingHasChangesKey from the session storage',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      service.setBookingHasChanged(false);
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
  it('should map HearingDetailsResponse to HearingModel',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      const date = Date.now();
      const caseModel = new CaseResponse2();
      caseModel.name = 'case1';
      caseModel.number = 'Number 1';
      const model = new HearingDetailsResponse();
      model.id = '232423423jsn';
      model.case_type_name = 'Tax';
      model.hearing_type_name = 'hearing type';
      model.scheduled_date_time = new Date(date);
      model.scheduled_duration = 30;
      model.hearing_venue_name = 'court address';
      model.hearing_room_name = 'room 09';
      model.other_information = 'note';
      model.cases = [caseModel];
      model.participants = [];

      const request = service.mapHearingDetailsResponseToHearingModel(model);
      expect(request.hearing_id).toEqual(model.id);
      expect(request.case_type).toBe('Tax');
      expect(request.court_room).toBe('room 09');
      expect(request.court_name).toBe('court address');
      expect(request.other_information).toBe('note');
      expect(request.cases).toBeTruthy();
      expect(request.cases[0].name).toBe('case1');
      expect(request.cases[0].number).toBe('Number 1');
      expect(request.scheduled_date_time).toEqual(new Date(date));
      expect(request.scheduled_duration).toBe(30);
    }));
  it('should map ParticipantResponse to ParticipantModel',
    inject([VideoHearingsService], (service: VideoHearingsService) => {

      const participants: ParticipantResponse[] = [];
      const participant = new ParticipantResponse();
      participant.title = 'Mr';
      participant.first_name = 'Dan';
      participant.middle_names = 'Ivan';
      participant.last_name = 'Smith';
      participant.username = 'dan@email.aa';
      participant.display_name = 'Dan Smith';
      participant.contact_email = 'dan@email.aa';
      participant.telephone_number = '123123123';
      participant.case_role_name = 'Defendant';
      participant.hearing_role_name = 'Defendant LIP';
      participant.house_number = '123';
      participant.street = 'Test Street';
      participant.city = 'Test City';
      participant.county = 'Test County';
      participant.postcode = 'TE1 TNR';
      participants.push(participant);

      const model = service.mapParticipantResponseToParticipantModel(participants);

      expect(model[0].title).toEqual(participant.title);
      expect(model[0].first_name).toEqual(participant.first_name);
      expect(model[0].middle_names).toEqual(participant.middle_names);
      expect(model[0].last_name).toEqual(participant.last_name);
      expect(model[0].username).toEqual(participant.username);
      expect(model[0].display_name).toEqual(participant.display_name);
      expect(model[0].email).toEqual(participant.contact_email);
      expect(model[0].phone).toEqual(participant.telephone_number);
      expect(model[0].case_role_name).toEqual(participant.case_role_name);
      expect(model[0].hearing_role_name).toEqual(participant.hearing_role_name);
      expect(model[0].housenumber).toEqual(participant.house_number);
      expect(model[0].street).toEqual(participant.street);
      expect(model[0].city).toEqual(participant.city);
      expect(model[0].county).toEqual(participant.county);
      expect(model[0].postcode).toEqual(participant.postcode);
    }));
  it('should map ParticipantModel toParticipantResponse',
    inject([VideoHearingsService], (service: VideoHearingsService) => {

      const participants: ParticipantModel[] = [];
      const participant = new ParticipantModel();
      participant.title = 'Mr';
      participant.first_name = 'Dan';
      participant.middle_names = 'Ivan';
      participant.last_name = 'Smith';
      participant.username = 'dan@email.aa';
      participant.display_name = 'Dan Smith';
      participant.email = 'dan@email.aa';
      participant.phone = '123123123';
      participant.case_role_name = 'Defendant';
      participant.hearing_role_name = 'Defendant LIP';
      participant.housenumber = '123';
      participant.street = 'Test Street';
      participant.city = 'Test City';
      participant.county = 'Test County';
      participant.postcode = 'TE1 TNR';
      participants.push(participant);

      const model = service.mapParticipants(participants);

      expect(model[0].title).toEqual(participant.title);
      expect(model[0].first_name).toEqual(participant.first_name);
      expect(model[0].middle_names).toEqual(participant.middle_names);
      expect(model[0].last_name).toEqual(participant.last_name);
      expect(model[0].username).toEqual(participant.username);
      expect(model[0].display_name).toEqual(participant.display_name);
      expect(model[0].contact_email).toEqual(participant.email);
      expect(model[0].telephone_number).toEqual(participant.phone);
      expect(model[0].case_role_name).toEqual(participant.case_role_name);
      expect(model[0].hearing_role_name).toEqual(participant.hearing_role_name);
      expect(model[0].house_number).toEqual(participant.housenumber);
      expect(model[0].street).toEqual(participant.street);
      expect(model[0].city).toEqual(participant.city);
      expect(model[0].county).toEqual(participant.county);
      expect(model[0].postcode).toEqual(participant.postcode);
    }));
  it('should map Existing hearing',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      const participants: ParticipantModel[] = [];
      const participant = new ParticipantModel();
      participant.title = 'Mr';
      participant.first_name = 'Dan';
      participant.middle_names = 'Ivan';
      participant.last_name = 'Smith';
      participant.username = 'dan@email.aa';
      participant.display_name = 'Dan Smith';
      participant.email = 'dan@email.aa';
      participant.phone = '123123123';
      participant.case_role_name = 'Defendant';
      participant.hearing_role_name = 'Defendant LIP';
      participant.housenumber = '123';
      participant.street = 'Test Street';
      participant.city = 'Test City';
      participant.county = 'Test County';
      participant.postcode = 'TE1 TNR';
      participants.push(participant);
      const caseModel = new CaseModel();
      caseModel.name = 'case1';
      caseModel.number = 'Number 1';
      const hearingModel = new HearingModel();
      hearingModel.court_room = 'Court Room1';
      hearingModel.court_name = 'Test Court';
      hearingModel.other_information = 'Other Information';
      hearingModel.scheduled_date_time = new Date();
      hearingModel.scheduled_duration = 45;
      hearingModel.participants = participants;
      hearingModel.cases = [caseModel];

      const editHearingRequest = service.mapExistingHearing(hearingModel);
      const actualParticipant = editHearingRequest.participants[0];
      const expectedParticipant = hearingModel.participants[0];
      const expectedCase = hearingModel.cases[0];
      const actualCase = editHearingRequest.case;
      expect(editHearingRequest.hearing_room_name).toEqual(hearingModel.court_room);
      expect(editHearingRequest.hearing_venue_name).toEqual(hearingModel.court_name);
      expect(editHearingRequest.other_information).toEqual(hearingModel.other_information);
      expect(editHearingRequest.scheduled_date_time).toEqual(hearingModel.scheduled_date_time);
      expect(editHearingRequest.scheduled_duration).toEqual(hearingModel.scheduled_duration);
      expect(editHearingRequest.participants.length).toBeGreaterThan(0);
      expect(actualParticipant.title).toEqual(expectedParticipant.title);
      expect(actualParticipant.first_name).toEqual(expectedParticipant.first_name);
      expect(actualParticipant.last_name).toEqual(expectedParticipant.last_name);
      expect(actualParticipant.middle_names).toEqual(expectedParticipant.middle_names);
      expect(actualParticipant.hearing_role_name).toEqual(expectedParticipant.hearing_role_name);
      expect(actualParticipant.case_role_name).toEqual(expectedParticipant.case_role_name);
      expect(actualParticipant.house_number).toEqual(expectedParticipant.housenumber);
      expect(actualParticipant.street).toEqual(expectedParticipant.street);
      expect(actualParticipant.city).toEqual(expectedParticipant.city);
      expect(actualParticipant.county).toEqual(expectedParticipant.county);
      expect(actualParticipant.postcode).toEqual(expectedParticipant.postcode);
      expect(actualCase.name).toEqual(expectedCase.name);
      expect(actualCase.number).toEqual(expectedCase.number);
    }));
  it('should map Existing hearing',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
      const participants: ParticipantModel[] = [];
      const participant = new ParticipantModel();
      participant.title = 'Mr';
      participant.first_name = 'Dan';
      participant.middle_names = 'Ivan';
      participant.last_name = 'Smith';
      participant.username = 'dan@email.aa';
      participant.display_name = 'Dan Smith';
      participant.email = 'dan@email.aa';
      participant.phone = '123123123';
      participant.case_role_name = 'Defendant';
      participant.hearing_role_name = 'Defendant LIP';
      participants.push(participant);
      const caseModel = new CaseModel();
      caseModel.name = 'case1';
      caseModel.number = 'Number 1';
      const hearingModel = new HearingModel();
      hearingModel.court_room = 'Court Room1';
      hearingModel.court_name = 'Test Court';
      hearingModel.other_information = 'Other Information';
      hearingModel.scheduled_date_time = new Date();
      hearingModel.scheduled_duration = 45;
      hearingModel.participants = participants;
      hearingModel.cases = [caseModel];

      const editHearingRequest = service.mapExistingHearing(hearingModel);

      expect(editHearingRequest.hearing_room_name).toEqual(hearingModel.court_room);
      expect(editHearingRequest.hearing_venue_name).toEqual(hearingModel.court_name);
      expect(editHearingRequest.other_information).toEqual(hearingModel.other_information);
      expect(editHearingRequest.scheduled_date_time).toEqual(hearingModel.scheduled_date_time);
      expect(editHearingRequest.scheduled_duration).toEqual(hearingModel.scheduled_duration);
      expect(editHearingRequest.participants.length).toBeGreaterThan(0);
      expect(editHearingRequest.participants[0].title).toEqual(hearingModel.participants[0].title);
      expect(editHearingRequest.participants[0].first_name).toEqual(hearingModel.participants[0].first_name);
      expect(editHearingRequest.participants[0].last_name).toEqual(hearingModel.participants[0].last_name);
      expect(editHearingRequest.participants[0].middle_names).toEqual(hearingModel.participants[0].middle_names);
      expect(editHearingRequest.participants[0].hearing_role_name).toEqual(hearingModel.participants[0].hearing_role_name);
      expect(editHearingRequest.participants[0].case_role_name).toEqual(hearingModel.participants[0].case_role_name);
      expect(editHearingRequest.case.name).toEqual(hearingModel.cases[0].name);
      expect(editHearingRequest.case.number).toEqual(hearingModel.cases[0].number);
    }));
});
