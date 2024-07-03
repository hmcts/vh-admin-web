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
    BookingStatus,
    AllocatedCsoResponse,
    JusticeUserResponse,
    JudiciaryParticipantResponse,
    EditMultiDayHearingRequest,
    CancelMultiDayHearingRequest,
    UpdateHearingInGroupRequest,
    AvailableLanguageResponse,
    InterprepretationType
} from './clients/api-client';
import { HearingModel } from '../common/model/hearing.model';
import { CaseModel } from '../common/model/case.model';
import { ParticipantModel } from '../common/model/participant.model';
import { lastValueFrom, map, of, scheduled } from 'rxjs';
import { EndpointModel } from '../common/model/endpoint.model';
import { LinkedParticipantModel, LinkedParticipantType } from '../common/model/linked-participant.model';
import { JudicialMemberDto } from '../booking/judicial-office-holders/models/add-judicial-member.model';
import { InterpreterSelectedDto } from '../booking/interpreter-form/interpreter-selected.model';

describe('Video hearing service', () => {
    let service: VideoHearingsService;
    let clientApiSpy: jasmine.SpyObj<BHClient>;
    const newRequestKey = 'bh-newRequest';
    const conferencePhoneNumberKey = 'conferencePhoneNumberKey';
    const conferencePhoneNumberWelshKey = 'conferencePhoneNumberWelshKey';
    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>([
            'getHearingTypes',
            'getParticipantRoles',
            'bookNewHearing',
            'cloneHearing',
            'getTelephoneConferenceIdById',
            'getConfigSettings',
            'getUserList',
            'getAllocationForHearing',
            'rebookHearing',
            'getHearingRoles',
            'editMultiDayHearing',
            'cancelMultiDayHearing'
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
        clientApiSpy.cloneHearing.and.returnValue(of(null));

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
        expect(request.audio_recording_required).toBe(true);
    });

    describe('mapHearingDetailsResponseToHearingModel', () => {
        it('should map HearingDetailsResponse to HearingModel', () => {
            const model = createHearingDetailsResponse();

            const request = service.mapHearingDetailsResponseToHearingModel(model);
            expect(request.hearing_id).toEqual(model.id);
            expect(request.case_type).toBe('Tax');
            expect(request.court_room).toBe('room 09');
            expect(request.court_name).toBe('court address');
            expect(request.other_information).toBe('note');
            expect(request.cases).toBeTruthy();
            expect(request.cases[0].name).toBe('case1');
            expect(request.cases[0].number).toBe('Number 1');
            expect(request.scheduled_date_time).toEqual(model.scheduled_date_time);
            expect(request.scheduled_duration).toBe(30);
            expect(request.audio_recording_required).toBeTruthy();
            expect(request.judiciaryParticipants[0]).toBeTruthy();
            expect(request.judiciaryParticipants[0].displayName).toBe('Judge Dan Smith');
            expect(request.isMultiDay).toBeFalsy();
            expect(request.multiDayHearingLastDayScheduledDateTime).toBeTruthy();
        });

        it('should map HearingDetailsResponse to HearingModel with non-null group id', () => {
            const model = createHearingDetailsResponse();
            model.group_id = '1234';

            const request = service.mapHearingDetailsResponseToHearingModel(model);
            expect(request.isMultiDay).toBeTruthy();
        });

        it('should map HearingDetailsResponse to HearingModel with non-null hearings in group', () => {
            const hearingInGroup = createHearingDetailsResponse();
            hearingInGroup.group_id = '1234';
            hearingInGroup.created_date = new Date();
            hearingInGroup.updated_date = new Date();
            const model = createHearingDetailsResponse();
            model.group_id = '1234';
            model.hearings_in_group = [hearingInGroup];
            const expectedMappedHearingInGroup = service.mapHearingDetailsResponseToHearingModel(hearingInGroup);

            const request = service.mapHearingDetailsResponseToHearingModel(model);
            expect(request.hearingsInGroup).toEqual([expectedMappedHearingInGroup]);
        });

        function createHearingDetailsResponse() {
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
            model.judiciary_participants = [
                new JudiciaryParticipantResponse({
                    title: 'Mr',
                    first_name: 'Dan',
                    last_name: 'Smith',
                    display_name: 'Judge Dan Smith',
                    email: 'joh@judge.com',
                    full_name: 'Dan Smith',
                    personal_code: '1234',
                    work_phone: '123123123',
                    role_code: 'Judge'
                })
            ];
            model.audio_recording_required = true;
            model.group_id = null;
            model.multi_day_hearing_last_day_scheduled_date_time = new Date(date);

            return model;
        }
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
        participant.user_role_name = 'Individual';
        participant.interpreter_language = null;
        participants.push(participant);

        const judgeParticipant = new ParticipantResponse();
        judgeParticipant.title = 'Mr';
        judgeParticipant.first_name = 'Judge';
        judgeParticipant.middle_names = 'MiddleNames';
        judgeParticipant.last_name = 'Test';
        judgeParticipant.username = 'judge@hmcts.net';
        judgeParticipant.display_name = 'Judge Test';
        judgeParticipant.contact_email = 'judge@hmcts.net';
        judgeParticipant.telephone_number = '123123123';
        judgeParticipant.case_role_name = null;
        judgeParticipant.hearing_role_name = null;
        judgeParticipant.user_role_name = 'Judge';
        judgeParticipant.interpreter_language = null;
        participants.push(judgeParticipant);

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
        expect(model[0].is_judge).toBeFalse();
        expect(model[0].interpretation_language).toBeNull();

        expect(model[1].title).toEqual(judgeParticipant.title);
        expect(model[1].first_name).toEqual(judgeParticipant.first_name);
        expect(model[1].middle_names).toEqual(judgeParticipant.middle_names);
        expect(model[1].last_name).toEqual(judgeParticipant.last_name);
        expect(model[1].username).toEqual(judgeParticipant.username);
        expect(model[1].display_name).toEqual(judgeParticipant.display_name);
        expect(model[1].email).toEqual(judgeParticipant.contact_email);
        expect(model[1].phone).toEqual(judgeParticipant.telephone_number);
        expect(model[1].case_role_name).toEqual(judgeParticipant.case_role_name);
        expect(model[1].hearing_role_name).toEqual(judgeParticipant.hearing_role_name);
        expect(model[1].is_judge).toBeTrue();
        expect(model[1].interpretation_language).toBeNull();
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
        endpoint.interpreter_language = null;
        endpoints.push(endpoint);

        const model = service.mapEndpointResponseToEndpointModel(endpoints, []);
        expect(model[0].displayName).toEqual(endpoint.display_name);
        expect(model[0].interpretationLanguage).toBeNull();
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

    it('should get welsh conference phone number from session storage', async () => {
        const expected = '54321';
        sessionStorage.setItem(conferencePhoneNumberWelshKey, expected);
        const cachedRequest = sessionStorage.getItem(conferencePhoneNumberWelshKey);
        expect(cachedRequest).toBeDefined();

        const phone = await service.getConferencePhoneNumber(true);
        expect(phone).toBe(expected);
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

    it('should persist welsh conference phone number and get it from api', async () => {
        sessionStorage.removeItem(conferencePhoneNumberWelshKey);
        clientApiSpy.getConfigSettings.and.returnValue(
            of(new ClientSettingsResponse({ conference_phone_number_welsh: '54321', client_id: '6' }))
        );

        const phone = await service.getConferencePhoneNumber(true);
        expect(clientApiSpy.getConfigSettings).toHaveBeenCalled();

        const cachedRequest = sessionStorage.getItem(conferencePhoneNumberWelshKey);

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

    it('should rebook hearing', async () => {
        clientApiSpy.rebookHearing.and.returnValue(of(null));

        await service.rebookHearing('hearingId');
        expect(clientApiSpy.rebookHearing).toHaveBeenCalled();
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
        let model: HearingModel;
        beforeEach(() => {
            model = new HearingModel();
            model.scheduled_date_time = new Date();
            model.status = BookingStatus.Created;
        });

        it('should return false if hearing is not about to start', () => {
            model.scheduled_date_time.setMinutes(model.scheduled_date_time.getMinutes() + aboutToStartMinutesThreshold + 5);
            service.updateHearingRequest(model);
            expect(service.isHearingAboutToStart()).toBe(false);
        });

        it('should return false if hearing is not about to start & is not confirmed', () => {
            model.isConfirmed = false;
            model.scheduled_date_time.setMinutes(model.scheduled_date_time.getMinutes() + aboutToStartMinutesThreshold - 5);
            service.updateHearingRequest(model);
            expect(service.isHearingAboutToStart()).toBe(false);
        });

        it('should return true if hearing is not about to start & is confirmed', () => {
            model.isConfirmed = true;
            model.scheduled_date_time.setMinutes(model.scheduled_date_time.getMinutes() + aboutToStartMinutesThreshold - 5);
            service.updateHearingRequest(model);
            expect(service.isHearingAboutToStart()).toBe(true);
        });

        it('should return false if there is no scheduled_date_time', () => {
            model.scheduled_date_time = null;
            service.updateHearingRequest(model);
            expect(service.isHearingAboutToStart()).toBe(false);
        });

        it('should return false if there is no status', () => {
            model.status = null;
            service.updateHearingRequest(model);
            expect(service.isHearingAboutToStart()).toBe(false);
        });

        it('should not have changes if we set it to false', () => {
            service.setVhoNonAvailabiltiesHaveChanged(true);
            expect(service.hasUnsavedVhoNonAvailabilityChanges()).toBe(true);
            service.setVhoNonAvailabiltiesHaveChanged(false);
            expect(service.hasUnsavedVhoNonAvailabilityChanges()).toBe(false);
        });
    });

    describe('getAllocatedCsoForHearing', () => {
        it('should return an allocated cso for the hearing id', done => {
            const allocatedCsoObj = new AllocatedCsoResponse({ hearing_id: 'id', cso: new JusticeUserResponse() });
            clientApiSpy.getAllocationForHearing.and.returnValue(of(allocatedCsoObj));
            const response = lastValueFrom(clientApiSpy.getAllocationForHearing(allocatedCsoObj.hearing_id));
            response.then(res => {
                expect(clientApiSpy.getAllocationForHearing).toHaveBeenCalled();
                expect(res).toEqual(allocatedCsoObj);
                done();
            });
        });
    });

    it('should get hearing roles', async () => {
        clientApiSpy.getHearingRoles.and.returnValue(of(null));

        await service.getHearingRoles();
        expect(clientApiSpy.getHearingRoles).toHaveBeenCalled();
    });

    describe('addJudiciaryJudge', () => {
        it('should add a new judge when none exists', () => {
            // Arrange
            const judicialMember = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '1234', false);
            spyOn(service['modelHearing'].judiciaryParticipants, 'findIndex').and.returnValue(-1);

            // Act
            service.addJudiciaryJudge(judicialMember);

            // Assert
            expect(service['modelHearing'].judiciaryParticipants.length).toBe(1);
            expect(service['modelHearing'].judiciaryParticipants[0]).toBe(judicialMember);
        });

        it('should replace an existing judge', () => {
            // Arrange
            const newJudge = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '1234', false);
            const existingJudge = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '5678', false);
            service['modelHearing'].judiciaryParticipants.push(existingJudge);
            spyOn(service['modelHearing'].judiciaryParticipants, 'findIndex').and.returnValue(0);

            // Act
            service.addJudiciaryJudge(newJudge);

            // Assert
            expect(service['modelHearing'].judiciaryParticipants.length).toBe(1);
            expect(service['modelHearing'].judiciaryParticipants[0]).toBe(newJudge);
        });

        it('should replace an existing judge, from participant list', () => {
            // Arrange
            const newJudge = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '1234', false);
            const existingJudge = new ParticipantModel();
            existingJudge.username = 'judge';
            service['modelHearing'].participants.push(existingJudge);
            spyOn(service['modelHearing'].participants, 'findIndex').and.returnValue(0);

            // Act
            service.addJudiciaryJudge(newJudge);

            // Assert
            expect(service['modelHearing'].judiciaryParticipants.length).toBe(1);
            expect(service['modelHearing'].participants.length).toBe(0);
            expect(service['modelHearing'].judiciaryParticipants[0]).toBe(newJudge);
        });
    });

    describe('removeJudiciaryJudge', () => {
        it('should remove judge from judiciary participants', () => {
            // Arrange
            const judge = new JudicialMemberDto('Test', 'User', 'Test User', 'test1@test.com', '1234567890', '1234', false);
            judge.roleCode = 'Judge';
            const nonJudge = new JudicialMemberDto('Test', 'User', 'Test User', 'test2@test.com', '1234567890', '5678', false);
            nonJudge.roleCode = 'PanelMember';
            service['modelHearing'].judiciaryParticipants = [judge, nonJudge];

            // Act
            service.removeJudiciaryJudge();

            // Assert
            expect(service['modelHearing'].judiciaryParticipants.length).toBe(1);
            expect(service['modelHearing'].judiciaryParticipants[0]).toBe(nonJudge);
        });

        it('should not remove anything if judge is not present', () => {
            // Arrange
            const nonJudge1 = new JudicialMemberDto('Test', 'User', 'Test User', 'test1@test.com', '1234567890', '1234', false);
            nonJudge1.roleCode = 'PanelMember';
            const nonJudge2 = new JudicialMemberDto('Test', 'User', 'Test User', 'test2@test.com', '1234567890', '5678', false);
            nonJudge2.roleCode = 'PanelMember';
            service['modelHearing'].judiciaryParticipants = [nonJudge1, nonJudge2];

            // Act
            service.removeJudiciaryJudge();

            // Assert
            expect(service['modelHearing'].judiciaryParticipants.length).toBe(2);
            expect(service['modelHearing'].judiciaryParticipants[0]).toBe(nonJudge1);
            expect(service['modelHearing'].judiciaryParticipants[1]).toBe(nonJudge2);
        });
    });

    describe('addJudiciaryPanelMember', () => {
        it('should add a new judiciary panel member', () => {
            const judicialMember = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '1234', false);

            service.addJudiciaryPanelMember(judicialMember);

            expect(service['modelHearing'].judiciaryParticipants.length).toBe(1);
            expect(service['modelHearing'].judiciaryParticipants[0]).toEqual(judicialMember);
        });

        it('should update an existing judiciary panel member', () => {
            const judicialMember1 = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '1234', false);
            judicialMember1.displayName = 'Test User 1';
            const judicialMember2 = new JudicialMemberDto('Test', 'User', 'Test User', 'test@test.com', '1234567890', '1234', false);
            judicialMember2.displayName = 'Test User 2';

            service.addJudiciaryPanelMember(judicialMember1);
            service.addJudiciaryPanelMember(judicialMember2);

            expect(service['modelHearing'].judiciaryParticipants.length).toBe(1);
            expect(service['modelHearing'].judiciaryParticipants[0]).toEqual(judicialMember2);
        });
    });

    describe('removeJudiciaryParticipant', () => {
        it('should remove judiciary participant from modelHearing', () => {
            // Arrange
            const participantEmail = 'test@example.com';
            const judicialMember = new JudicialMemberDto('Test', 'User', 'Test User', participantEmail, '1234567890', '1234', false);
            service['modelHearing'].judiciaryParticipants = [judicialMember];

            // Act
            service.removeJudiciaryParticipant(participantEmail);

            // Assert
            expect(service['modelHearing'].judiciaryParticipants).not.toContain(judicialMember);
        });

        it('should not remove judiciary participant if email does not match', () => {
            // Arrange
            const participantEmail = 'test@example.com';
            const judicialMember = new JudicialMemberDto('Test', 'User', 'Test User', participantEmail, '1234567890', '1234', false);
            service['modelHearing'].judiciaryParticipants = [judicialMember];

            // Act
            service.removeJudiciaryParticipant('other@example.com');

            // Assert
            expect(service['modelHearing'].judiciaryParticipants).toContain(judicialMember);
        });

        it('should not remove judiciary participant if modelHearing is undefined', () => {
            // Arrange
            service['modelHearing'] = undefined;

            // Act
            service.removeJudiciaryParticipant('test@example.com');

            // Assert
            expect(service['modelHearing']).toBeUndefined();
        });
    });

    describe('updateMultiDayHearing', () => {
        const hearing = new HearingModel();
        const date = Date.now();
        const caseModel = new CaseModel();
        caseModel.name = 'case1';
        caseModel.number = 'Number 1';
        hearing.hearing_id = 'a8c6a042-bc0d-4846-a186-720cd1ddce58';
        hearing.case_type = 'Tax';
        hearing.scheduled_date_time = new Date(date);
        hearing.scheduled_duration = 30;
        hearing.cases = [caseModel];
        hearing.audio_recording_required = true;
        hearing.court_code = '701411';
        hearing.court_name = 'Manchester Civil and Family Justice Centre';
        hearing.court_room = 'Court Room1';
        hearing.other_information = 'Other information';
        const judiciaryParticipants: JudicialMemberDto[] = [];
        judiciaryParticipants.push(
            new JudicialMemberDto(
                'Court',
                'Judge',
                'Training.Judge1',
                'Training.Judge1@hearings.reform.hmcts.net',
                '',
                'Training.Judge1',
                true
            )
        );
        hearing.judiciaryParticipants = judiciaryParticipants;
        const participants: ParticipantModel[] = [];
        participants.push(
            new ParticipantModel({
                id: 'e09882e8-345c-4bbb-b412-af6f4f622a24',
                email: 'app.litigant@email.com',
                display_name: 'Litigant',
                hearing_role_code: 'APPL'
            })
        );
        hearing.participants = participants;
        const endpoints: EndpointModel[] = [];
        const endpoint = new EndpointModel();
        endpoint.id = 'b3e1521e-9e0e-496e-4cc9-08dc1682b559';
        endpoint.displayName = 'Endpoint A';
        endpoints.push(endpoint);
        hearing.endpoints = endpoints;
        hearing.hearingsInGroup = [Object.assign({}, hearing)];

        beforeEach(() => {
            clientApiSpy.editMultiDayHearing.calls.reset();
        });

        it('should call api to update hearing', () => {
            // Arrange
            hearing.isMultiDayEdit = false;

            // Act
            service.updateMultiDayHearing(hearing);

            // Assert
            const expectedRequest = mapExpectedRequest();
            expect(clientApiSpy.editMultiDayHearing).toHaveBeenCalledWith(hearing.hearing_id, expectedRequest);
        });

        it('should call api to update hearing and future hearings', () => {
            // Arrange
            hearing.isMultiDayEdit = true;

            // Act
            service.updateMultiDayHearing(hearing);

            // Assert
            const expectedRequest = mapExpectedRequest();
            expect(clientApiSpy.editMultiDayHearing).toHaveBeenCalledWith(hearing.hearing_id, expectedRequest);
        });

        function mapExpectedRequest() {
            const mappedHearing = service.mapExistingHearing(hearing);
            const expectedRequest = new EditMultiDayHearingRequest();
            expectedRequest.scheduled_duration = mappedHearing.scheduled_duration;
            expectedRequest.hearing_venue_code = mappedHearing.hearing_venue_code;
            expectedRequest.hearing_venue_name = mappedHearing.hearing_venue_name;
            expectedRequest.hearing_room_name = mappedHearing.hearing_room_name;
            expectedRequest.other_information = mappedHearing.other_information;
            expectedRequest.case_number = mappedHearing.case.number;
            expectedRequest.audio_recording_required = mappedHearing.audio_recording_required;
            expectedRequest.participants = mappedHearing.participants;
            expectedRequest.judiciary_participants = mappedHearing.judiciary_participants;
            expectedRequest.endpoints = mappedHearing.endpoints;
            expectedRequest.update_future_days = hearing.isMultiDayEdit;
            expectedRequest.hearings_in_group = hearing.hearingsInGroup.map(
                h =>
                    new UpdateHearingInGroupRequest({
                        hearing_id: h.hearing_id,
                        scheduled_date_time: h.scheduled_date_time
                    })
            );

            return expectedRequest;
        }
    });

    describe('cancelMultiDayBooking', () => {
        it('should call api to cancel hearing', () => {
            // Arrange
            const hearingId = '96fc8dbc-012d-4f03-9a72-76dd06918f45';
            const cancelReason = 'cancellation reason';
            const updateFutureDays = true;

            // Act
            service.cancelMultiDayBooking(hearingId, cancelReason, updateFutureDays);

            // Assert
            const expectedRequest = new CancelMultiDayHearingRequest({
                cancel_reason: cancelReason,
                update_future_days: updateFutureDays
            });
            expect(clientApiSpy.cancelMultiDayHearing).toHaveBeenCalledWith(hearingId, expectedRequest);
        });
    });

    describe('mapJudicialMemberDtoToJudiciaryParticipantRequest', () => {
        it('should map judicial member dto', () => {
            // Arrange
            const dtos: JudicialMemberDto[] = [];
            const language: InterpreterSelectedDto = {
                signLanguageCode: null,
                spokenLanguageCode: 'fr',
                interpreterRequired: true
            };
            const dto = new JudicialMemberDto('FirstName', 'LastName', 'FullName', 'Email', '1234', 'PersonalCode', true);
            dto.interpretationLanguage = language;
            dtos.push(dto);

            // Act
            const result = service.mapJudicialMemberDtoToJudiciaryParticipantRequest(dtos);

            // Assert
            expect(result.length).toBe(dtos.length);
            expect(result[0].personal_code).toBe(dto.personalCode);
            expect(result[0].display_name).toBe(dto.displayName);
            expect(result[0].role).toBe(dto.roleCode);
            expect(result[0].optional_contact_email).toBe(dto.optionalContactEmail);
            expect(result[0].optional_contact_telephone).toBe(dto.optionalContactNumber);
            expect(result[0].interpreter_language_code).toBe(dto.interpretationLanguage.spokenLanguageCode);
        });
    });

    describe('mapParticipants', () => {
        it('should map participants', () => {
            // Arrange
            const participants: ParticipantModel[] = [];
            const language: InterpreterSelectedDto = {
                signLanguageCode: null,
                spokenLanguageCode: 'fr',
                interpreterRequired: true
            };
            const participant = new ParticipantModel({
                interpretation_language: language
            });
            participants.push(participant);

            // Act
            const result = service.mapParticipants(participants);

            // Assert
            expect(result.length).toBe(participants.length);
            expect(result[0].interpreter_language_code).toBe(participant.interpretation_language.spokenLanguageCode);
        });
    });

    describe('mapEndpoints', () => {
        it('should map endpoints', () => {
            // Arrange
            const endpoints: EndpointModel[] = [];
            const language: InterpreterSelectedDto = {
                signLanguageCode: null,
                spokenLanguageCode: 'fr',
                interpreterRequired: true
            };
            const endpoint = new EndpointModel();
            endpoint.interpretationLanguage = language;
            endpoints.push(endpoint);

            // Act
            const result = service.mapEndpoints(endpoints);

            // Assert
            expect(result.length).toBe(endpoints.length);
            expect(result[0].interpreter_language_code).toBe(endpoint.interpretationLanguage.spokenLanguageCode);
        });
    });

    describe('mapInterpreterLanguageCode', () => {
        it('should return spoken language code when specified', () => {
            // Arrange
            const language: InterpreterSelectedDto = {
                signLanguageCode: null,
                spokenLanguageCode: 'fr',
                interpreterRequired: true
            };

            // Act
            const result = service.mapInterpreterLanguageCode(language);

            // Assert
            expect(result).toBe(language.spokenLanguageCode);
        });

        it('should return sign language code when specified', () => {
            // Arrange
            const language: InterpreterSelectedDto = {
                signLanguageCode: 'bfi',
                spokenLanguageCode: null,
                interpreterRequired: true
            };

            // Act
            const result = service.mapInterpreterLanguageCode(language);

            // Assert
            expect(result).toBe(language.signLanguageCode);
        });

        it('should return null when no language specified', () => {
            // Arrange
            const language: InterpreterSelectedDto = null;

            // Act
            const result = service.mapInterpreterLanguageCode(language);

            // Assert
            expect(result).toBeNull();
        });
    });
});
