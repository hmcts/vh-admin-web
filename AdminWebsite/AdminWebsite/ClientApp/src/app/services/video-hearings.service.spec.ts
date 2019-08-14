import { VideoHearingsService } from './video-hearings.service';
import {
  BHClient, HearingDetailsResponse, CaseResponse2, ParticipantResponse, CaseAndHearingRolesResponse
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';
import { CaseModel } from '../common/model/case.model';
import { ParticipantModel } from '../common/model/participant.model';
import { of } from 'rxjs';

describe('Video hearing service', () => {
  let service: VideoHearingsService;
  let clientApiSpy: jasmine.SpyObj<BHClient>;
  const newRequestKey = 'bh-newRequest';

  beforeEach(() => {
    clientApiSpy = jasmine.createSpyObj<BHClient>(['getHearingTypes', 'getParticipantRoles', 'bookNewHearing']);
    service = new VideoHearingsService(clientApiSpy);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create new hearing when persistence storage is empty', () => {
    const currentRequest = service.getCurrentRequest();
    expect(currentRequest).toBeDefined();
  });

  it('should persist hearing request on update and remove on cancellation', () => {
      const currentRequest = service.getCurrentRequest();
      service.updateHearingRequest(currentRequest);
      let cachedRequest = sessionStorage.getItem(newRequestKey);
      expect(cachedRequest).toBeDefined();
      service.cancelRequest();
      cachedRequest = sessionStorage.getItem(newRequestKey);
      expect(cachedRequest).toBeNull();
    });

  it('should have no unsaved changes if hearing has not been set', () => {
      expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('should not have changes if we set it to false', () => {
      service.setBookingHasChanged(true);
      expect(service.hasUnsavedChanges()).toBe(true);
      service.setBookingHasChanged(false);
      expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('should have changes when updating hearing request', () => {
    const model = new HearingModel();
    service.updateHearingRequest(model);

    expect(service.hasUnsavedChanges()).toBe(true);
  });

  it('should get hearings types', () => {
      service.getHearingTypes();
      expect(clientApiSpy.getHearingTypes).toHaveBeenCalled();
  });

  it('should returns invalid hearing request', () => {
      const currentRequest = service.validCurrentRequest();
      expect(currentRequest).toBeFalsy();
  });

  it('should cache current hearing request', () => {
    const model = new HearingModel();
    model.hearing_id = 'hearingId';
    service.updateHearingRequest(model);
    expect(service.getCurrentRequest().hearing_id).toBe('hearingId');
  });

  it('should cache participant roles', async () => {
    // given the api responds with
    const serverResponse = new CaseAndHearingRolesResponse({
      name: 'Defendant',
      hearing_roles: [ 'Solicitor', 'LIP' ]
    });
    clientApiSpy.getParticipantRoles.and.returnValue(of([serverResponse]));

    // we get the response the first time
    const response = await service.getParticipantRoles('Defendant');
    expect(response).toEqual([serverResponse]);

    // second time we get a cached value
    await service.getParticipantRoles('Defendant');
    expect(clientApiSpy.getParticipantRoles).toHaveBeenCalledTimes(1);
  });

  it('should remove currently cached hearing when cancelling', () => {
    const model = new HearingModel();
    model.hearing_id = 'hearingId';
    service.updateHearingRequest(model);
    service.cancelRequest();
    expect(service.getCurrentRequest().hearing_id).not.toBe('hearingId');
  });

  it('should save hearing request in database', () => {
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
      model.questionnaire_not_required = true;

      service.saveHearing(model);
      expect(clientApiSpy.bookNewHearing).toHaveBeenCalled();
  });

  it('should map hearing request', () => {
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
      model.questionnaire_not_required = true;

      const request = service.mapHearing(model);

      expect(request.case_type_name).toBe('Tax');
      expect(request.hearing_room_name).toBe('room 09');
      expect(request.hearing_venue_name).toBe('court address');
      expect(request.other_information).toBe('note');
      expect(request.cases).toBeTruthy();
      expect(request.cases[0].name).toBe('case1');
      expect(request.cases[0].number).toBe('Number 1');
      expect(request.scheduled_date_time).toEqual(new Date(date));
      expect(request.scheduled_duration).toBe(30);
      expect(request.questionnaire_not_required).toBe(true);
  });

  it('should map HearingDetailsResponse to HearingModel', () => {
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
      model.questionnaire_not_required = true;

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
      expect(request.questionnaire_not_required).toBeTruthy();
  });

  it('should map ParticipantResponse to ParticipantModel', () => {
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
  });

  it('should map ParticipantModel toParticipantResponse', () => {
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
  });

  it('should map Existing hearing', () => {
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
      hearingModel.questionnaire_not_required = true;

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
      expect(editHearingRequest.questionnaire_not_required).toBeTruthy();
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
  });

  it('should map Existing hearing', () => {
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
      hearingModel.questionnaire_not_required = true;

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
      expect(editHearingRequest.questionnaire_not_required).toEqual(hearingModel.questionnaire_not_required);
  });
});
