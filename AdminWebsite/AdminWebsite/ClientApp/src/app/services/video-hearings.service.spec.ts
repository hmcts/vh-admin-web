import { VideoHearingsService } from './video-hearings.service';
import {
    BHClient,
    HearingDetailsResponse,
    CaseResponse,
    ParticipantResponse,
    CaseAndHearingRolesResponse,
    EndpointResponse,
    MultiHearingRequest,
    ClientSettingsResponse,
    HearingRole,
    LinkedParticipantResponse,
    BookingStatus
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';
import { CaseModel } from '../common/model/case.model';
import { ParticipantModel } from '../common/model/participant.model';
import { of } from 'rxjs';
import { EndpointModel } from '../common/model/endpoint.model';
import { LinkedParticipantModel, LinkedParticipantType } from '../common/model/linked-participant.model';
import { Component } from '@angular/core';

describe('Video hearing service', () => {
    let service: VideoHearingsService;
    let clientApiSpy: jasmine.SpyObj<BHClient>;
    const newRequestKey = 'bh-newRequest';
    const conferencePhoneNumberKey = 'conferencePhoneNumberKey';
    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>([
            'getHearingTypes',
            'getParticipantRoles',
            'bookNewHearing',
            'cloneHearing',
            'getTelephoneConferenceIdById',
            'getConfigSettings'
        ]);
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
    it('should clone hearing', async () => {
        clientApiSpy.cloneHearing.and.returnValue(of());

        await service.cloneMultiHearings('hearingId', new MultiHearingRequest());
        expect(clientApiSpy.cloneHearing).toHaveBeenCalled();
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
            name: 'Respondent',
            hearing_roles: [
                new HearingRole({ name: 'Representative', user_role: 'Representative' }),
                new HearingRole({ name: 'Litigant in person', user_role: 'Individual' })
            ]
        });
        clientApiSpy.getParticipantRoles.and.returnValue(of([serverResponse]));

        // we get the response the first time
        const response = await service.getParticipantRoles('Respondent');
        expect(response).toEqual([serverResponse]);

        // second time we get a cached value
        await service.getParticipantRoles('Respondent');
        expect(clientApiSpy.getParticipantRoles).toHaveBeenCalledTimes(1);
    });

    it('should remove currently cached hearing when cancelling', () => {
        const model = new HearingModel();
        model.hearing_id = 'hearingId';
        service.updateHearingRequest(model);
        service.cancelRequest();
        expect(service.getCurrentRequest().hearing_id).not.toBe('hearingId');
    });

    it('should save hearing request in database', async () => {
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
        model.questionnaire_not_required = false;
        model.audio_recording_required = true;
        const response = new HearingDetailsResponse({ id: '1234566' });
        clientApiSpy.bookNewHearing.and.returnValue(of(response));

        await service.saveHearing(model);
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
        model.questionnaire_not_required = false;
        model.audio_recording_required = true;
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
        expect(request.questionnaire_not_required).toBe(false);
        expect(request.audio_recording_required).toBe(true);
    });

    it('should map HearingDetailsResponse to HearingModel', () => {
        const date = Date.now();
        const caseModel = new CaseResponse();
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
        model.questionnaire_not_required = false;
        model.audio_recording_required = true;

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
        expect(request.questionnaire_not_required).toBeFalsy();
        expect(request.audio_recording_required).toBeTruthy();
    });

    it('should map ParticipantResponse to ParticipantModel', () => {
        const participants: ParticipantResponse[] = [];
        const participant = new ParticipantResponse();
        participant.title = 'Mr';
        participant.first_name = 'Dan';
        participant.middle_names = 'Ivan';
        participant.last_name = 'Smith';
        participant.username = 'dan@hmcts.net';
        participant.display_name = 'Dan Smith';
        participant.contact_email = 'dan@hmcts.net';
        participant.telephone_number = '123123123';
        participant.case_role_name = 'Respondent';
        participant.hearing_role_name = 'Litigant in person';
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
    });

    it('should map ParticipantModel toParticipantResponse', () => {
        const participants: ParticipantModel[] = [];
        const participant = new ParticipantModel();
        participant.title = 'Mr';
        participant.first_name = 'Dan';
        participant.middle_names = 'Ivan';
        participant.last_name = 'Smith';
        participant.username = 'dan@hmcts.net';
        participant.display_name = 'Dan Smith';
        participant.email = 'dan@hmcts.net';
        participant.phone = '123123123';
        participant.case_role_name = 'Respondent';
        participant.hearing_role_name = 'Litigant in person';
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
    });

    it('should map Existing hearing', () => {
        const participants: ParticipantModel[] = [];
        const participant = new ParticipantModel();
        participant.title = 'Mr';
        participant.first_name = 'Dan';
        participant.middle_names = 'Ivan';
        participant.last_name = 'Smith';
        participant.username = 'dan@hmcts.net';
        participant.display_name = 'Dan Smith';
        participant.email = 'dan@hmcts.net';
        participant.phone = '123123123';
        participant.case_role_name = 'Respondent';
        participant.hearing_role_name = 'Litigant in person';
        const linkedParticipants: LinkedParticipantModel[] = [];
        const linkedParticipantModel = new LinkedParticipantModel();
        linkedParticipantModel.linkType = LinkedParticipantType.Interpreter;
        linkedParticipantModel.linkedParticipantId = '200';
        linkedParticipantModel.participantId = '100';
        linkedParticipants.push(linkedParticipantModel);
        participant.linked_participants = linkedParticipants;
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
        hearingModel.questionnaire_not_required = false;
        hearingModel.audio_recording_required = true;
        const endpoints: EndpointModel[] = [];
        const endpoint = new EndpointModel();
        endpoint.displayName = 'endpoint 001';
        endpoints.push(endpoint);
        hearingModel.endpoints = endpoints;

        const editHearingRequest = service.mapExistingHearing(hearingModel);
        const actualParticipant = editHearingRequest.participants[0];
        const expectedParticipant = hearingModel.participants[0];
        const expectedCase = hearingModel.cases[0];
        const actualCase = editHearingRequest.case;
        const actualEndpoint = editHearingRequest.endpoints[0].display_name;
        const expectedEndpoint = hearingModel.endpoints[0].displayName;
        const actualLinkedParticipants = editHearingRequest.participants[0].linked_participants[0];
        const expectedLinkedParticipants = hearingModel.participants[0].linked_participants[0];
        expect(editHearingRequest.hearing_room_name).toEqual(hearingModel.court_room);
        expect(editHearingRequest.hearing_venue_name).toEqual(hearingModel.court_name);
        expect(editHearingRequest.other_information).toEqual(hearingModel.other_information);
        expect(editHearingRequest.scheduled_date_time).toEqual(hearingModel.scheduled_date_time);
        expect(editHearingRequest.scheduled_duration).toEqual(hearingModel.scheduled_duration);
        expect(editHearingRequest.participants.length).toBeGreaterThan(0);
        expect(editHearingRequest.questionnaire_not_required).toBeFalsy();
        expect(editHearingRequest.audio_recording_required).toBeTruthy();
        expect(actualParticipant.title).toEqual(expectedParticipant.title);
        expect(actualParticipant.first_name).toEqual(expectedParticipant.first_name);
        expect(actualParticipant.last_name).toEqual(expectedParticipant.last_name);
        expect(actualParticipant.middle_names).toEqual(expectedParticipant.middle_names);
        expect(actualParticipant.hearing_role_name).toEqual(expectedParticipant.hearing_role_name);
        expect(actualParticipant.case_role_name).toEqual(expectedParticipant.case_role_name);
        expect(actualCase.name).toEqual(expectedCase.name);
        expect(actualCase.number).toEqual(expectedCase.number);
        expect(actualEndpoint).toEqual(expectedEndpoint);
        expect(actualLinkedParticipants.linked_id).toEqual(expectedLinkedParticipants.linkedParticipantId);
        expect(actualLinkedParticipants.type).toEqual(expectedLinkedParticipants.linkType);
    });

    it('should map Existing hearing', () => {
        const participants: ParticipantModel[] = [];
        const participant = new ParticipantModel();
        participant.title = 'Mr';
        participant.first_name = 'Dan';
        participant.middle_names = 'Ivan';
        participant.last_name = 'Smith';
        participant.username = 'dan@hmcts.net';
        participant.display_name = 'Dan Smith';
        participant.email = 'dan@hmcts.net';
        participant.phone = '123123123';
        participant.case_role_name = 'Respondent';
        participant.hearing_role_name = 'Litigant in person';
        const linkedParticipants: LinkedParticipantModel[] = [];
        const linkedParticipantModel = new LinkedParticipantModel();
        linkedParticipantModel.linkType = LinkedParticipantType.Interpreter;
        linkedParticipantModel.linkedParticipantId = '200';
        linkedParticipantModel.participantId = '100';
        linkedParticipants.push(linkedParticipantModel);
        participant.linked_participants = linkedParticipants;
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
        hearingModel.questionnaire_not_required = false;
        hearingModel.audio_recording_required = true;
        const endpoints: EndpointModel[] = [];
        const endpoint = new EndpointModel();
        endpoint.displayName = 'court room1';
        endpoints.push(endpoint);
        hearingModel.endpoints = endpoints;

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
        expect(editHearingRequest.audio_recording_required).toEqual(hearingModel.audio_recording_required);
        expect(editHearingRequest.endpoints[0].display_name).toEqual(hearingModel.endpoints[0].displayName);
        expect(editHearingRequest.participants[0].linked_participants[0].linked_id).toEqual(
            hearingModel.participants[0].linked_participants[0].linkedParticipantId
        );
        expect(editHearingRequest.participants[0].linked_participants[0].type).toEqual(
            hearingModel.participants[0].linked_participants[0].linkType
        );
    });

    it('should map EndpointResponse to EndpointModel', () => {
        const endpoints: EndpointResponse[] = [];
        const endpoint = new EndpointResponse();
        endpoint.display_name = 'endpoint 001';
        endpoints.push(endpoint);

        const model = service.mapEndpointResponseToEndpointModel(endpoints);
        expect(model[0].displayName).toEqual(endpoint.display_name);
    });

    it('should map EndpointModel toEndpointResponse', () => {
        const endpoints: EndpointModel[] = [];
        const endpoint = new EndpointModel();
        endpoint.displayName = 'court room 001';
        endpoints.push(endpoint);

        const model = service.mapEndpoints(endpoints);
        expect(model[0].display_name).toEqual(endpoint.displayName);
    });
    it('should get telephone conference Id for hearing', async () => {
        clientApiSpy.getTelephoneConferenceIdById.and.returnValue(of());

        service.getTelephoneConferenceId('hearingId');
        expect(clientApiSpy.getTelephoneConferenceIdById).toHaveBeenCalled();
    });

    it('should get conference phone number from session storage', async () => {
        sessionStorage.setItem(conferencePhoneNumberKey, '12345');
        const cachedRequest = sessionStorage.getItem(conferencePhoneNumberKey);
        expect(cachedRequest).toBeDefined();

        const phone = await service.getConferencePhoneNumber();
        expect(phone).toBe('12345');
    });
    it('should persist conference phone number and get it from api', async () => {
        sessionStorage.removeItem(conferencePhoneNumberKey);
        clientApiSpy.getConfigSettings.and.returnValue(
            of(new ClientSettingsResponse({ conference_phone_number: '12345', client_id: '6' }))
        );

        const phone = await service.getConferencePhoneNumber();
        expect(clientApiSpy.getConfigSettings).toHaveBeenCalled();

        const cachedRequest = sessionStorage.getItem(conferencePhoneNumberKey);

        expect(cachedRequest).toBeDefined();
    });
    it('should map LinkedParticipantModel to LinkedParticipantRequest', () => {
        const linkedParticipantModelList: LinkedParticipantModel[] = [];
        let linkedParticipantModel = new LinkedParticipantModel();
        linkedParticipantModel.participantEmail = 'interpreter@email.com';
        linkedParticipantModel.linkedParticipantEmail = 'interpretee@email.com';
        linkedParticipantModelList.push(linkedParticipantModel);

        linkedParticipantModel = new LinkedParticipantModel();
        linkedParticipantModel.participantEmail = 'interpretee@email.com';
        linkedParticipantModel.linkedParticipantEmail = 'interpreter@email.com';
        linkedParticipantModelList.push(linkedParticipantModel);

        const model = service.mapLinkedParticipants(linkedParticipantModelList);
        expect(model[0].participant_contact_email).toEqual(linkedParticipantModelList[0].participantEmail);
        expect(model[0].linked_participant_contact_email).toEqual(linkedParticipantModelList[0].linkedParticipantEmail);
        expect(model[1].participant_contact_email).toEqual(linkedParticipantModelList[1].participantEmail);
        expect(model[1].linked_participant_contact_email).toEqual(linkedParticipantModelList[1].linkedParticipantEmail);
    });
    it('should map LinkedParticipantResponse to LinkedParticipantModel', () => {
        const linkedParticipants: LinkedParticipantResponse[] = [];
        const linkedParticipant = new LinkedParticipantResponse();
        linkedParticipant.type = LinkedParticipantType.Interpreter;
        linkedParticipant.linked_id = '100';
        linkedParticipants.push(linkedParticipant);

        const model = service.mapLinkedParticipantResponseToLinkedParticipantModel(linkedParticipants);
        expect(model[0].linkType).toEqual(linkedParticipant.type);
        expect(model[0].linkedParticipantId).toEqual(linkedParticipant.linked_id);
    });

    describe('isConferenceClosed', () => {
        it('should return false if booking status booked and telephone conference Id is empty', () => {
            const model = new HearingModel();
            model.status = BookingStatus.Booked;
            model.telephone_conference_id = '';
            service.updateHearingRequest(model);
            expect(service.isConferenceClosed()).toBe(false);
        });
        it('should return false if booking status created and telephone conference Id is not empty', () => {
            const model = new HearingModel();
            model.status = BookingStatus.Created;
            model.telephone_conference_id = '1111';
            service.updateHearingRequest(model);
            expect(service.isConferenceClosed()).toBe(false);
        });
        it('should return false if booking status booked and telephone conference Id is not empty', () => {
            const model = new HearingModel();
            model.status = BookingStatus.Booked;
            model.telephone_conference_id = '1111';
            service.updateHearingRequest(model);
            expect(service.isConferenceClosed()).toBe(false);
        });
        it('should return true if booking status created and telephone conference Id is empty', () => {
            const model = new HearingModel();
            model.status = BookingStatus.Created;
            model.telephone_conference_id = '';
            service.updateHearingRequest(model);
            expect(service.isConferenceClosed()).toBe(true);
        });
    });

    describe('isHearingAboutToStart', () => {
        const aboutToStartMinutesThreshold = 30;

        it('should return false if hearing is not about to start', () => {
            const model = new HearingModel();
            model.scheduled_date_time = new Date();
            model.scheduled_date_time.setMinutes(model.scheduled_date_time.getMinutes() + aboutToStartMinutesThreshold + 5);
            service.updateHearingRequest(model);
            expect(service.isHearingAboutToStart()).toBe(false);
        });

        it('should return true if hearing is not about to start', () => {
            const model = new HearingModel();
            model.scheduled_date_time = new Date();
            model.scheduled_date_time.setMinutes(model.scheduled_date_time.getMinutes() + aboutToStartMinutesThreshold - 5);
            service.updateHearingRequest(model);
            expect(service.isHearingAboutToStart()).toBe(true);
        });
    });
});
