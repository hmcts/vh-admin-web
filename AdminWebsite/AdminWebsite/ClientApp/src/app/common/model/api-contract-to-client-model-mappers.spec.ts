import {
    AvailableLanguageResponse,
    BookingsHearingResponse,
    BookingStatus,
    BookingStatus2,
    CaseResponse,
    EndpointResponse,
    HearingDetailsResponse,
    InterprepretationType,
    JudiciaryParticipantResponse,
    LinkedParticipantResponse,
    LinkedParticipantType,
    ParticipantResponse,
    ScreeningResponse,
    ScreeningType,
    VideoSupplier
} from 'src/app/services/clients/api-client';
import { VHBooking } from './vh-booking';
import {
    mapBookingsHearingResponseToVHBooking,
    mapCaseNameAndNumberToCaseModel,
    mapCaseResponseToCaseModel,
    mapEndpointResponseToEndpointModel,
    mapHearingToVHBooking,
    mapLinkedParticipantResponseToLinkedParticipantModel,
    mapParticipantResponseToParticipantModel
} from './api-contract-to-client-model-mappers';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { Constants } from '../constants';

const DEFENCE_COUNSEL_ID = 'defence-counsel-id';

describe('mapHearingToVHBooking', () => {
    it('should map single day hearing', () => {
        // Arrange
        const hearing = createSingleDayHearing();

        // Act
        const result = mapHearingToVHBooking(hearing);

        // Assert
        verifyVHBooking(result, hearing);
        expect(result.isMultiDay).toBe(false);
    });

    it('should map multi day hearing', () => {
        // Arrange
        const hearing = createMultiDayHearing();

        // Act
        const result = mapHearingToVHBooking(hearing);

        // Assert
        verifyVHBooking(result, hearing);
        expect(result.isMultiDay).toBe(true);
        expect(result.multiDayHearingLastDayScheduledDateTime).toBe(hearing.multi_day_hearing_last_day_scheduled_date_time);
        expect(result.hearingsInGroup).toEqual(hearing.hearings_in_group.map(hearingInGroup => mapHearingToVHBooking(hearingInGroup)));
        expect(result.isLastDayOfMultiDayHearing).toBeFalse();
        result.hearingsInGroup.forEach(hearingInGroup => {
            const isLastDayOfMultiDayHearing =
                hearingInGroup.scheduled_date_time.getTime() === hearing.multi_day_hearing_last_day_scheduled_date_time.getTime();
            if (isLastDayOfMultiDayHearing) {
                expect(hearingInGroup.isLastDayOfMultiDayHearing).toBeTrue();
            } else {
                expect(hearingInGroup.isLastDayOfMultiDayHearing).toBeFalse();
            }
        });
        expect(result.groupId).toBe(hearing.group_id);
    });

    it('should map hearing without judge', () => {
        // Arrange
        const hearing = createSingleDayHearing();
        hearing.judiciary_participants = hearing.judiciary_participants.filter(participant => participant.role_code !== 'Judge');

        // Act
        const result = mapHearingToVHBooking(hearing);

        // Assert
        verifyVHBooking(result, hearing);
    });
});

describe('mapBookingsHearingResponseToVHBooking', () => {
    it('should map BookingsHearingResponse to VHBooking', () => {
        // Arrange
        const response = new BookingsHearingResponse();
        response.hearing_id = 'hearing-id';
        response.scheduled_date_time = new Date();
        response.scheduled_duration = 90;
        response.hearing_name = 'hearing-name';
        response.hearing_number = 'hearing-number';
        response.created_by = 'created-by';
        response.case_type_name = 'case-type-name';
        response.court_room = 'court-room';
        response.court_address = 'court-address';
        response.created_date = new Date();
        response.last_edit_by = 'last-edit-by';
        response.last_edit_date = new Date();
        response.status = BookingStatus2.Created;
        response.audio_recording_required = true;
        response.conference_supplier = VideoSupplier.Vodafone;
        response.judge_name = 'judge-name';
        response.group_id = 'group-id';

        // Act
        const result = mapBookingsHearingResponseToVHBooking(response);

        // Assert
        expect(result.hearing_id).toBe(response.hearing_id);
        expect(result.scheduled_date_time).toEqual(response.scheduled_date_time);
        expect(result.scheduled_duration).toBe(response.scheduled_duration);
        expect(result.case).toEqual(mapCaseNameAndNumberToCaseModel(response.hearing_name, response.hearing_number));
        expect(result.created_by).toBe(response.created_by);
        expect(result.case_type).toBe(response.case_type_name);
        expect(result.court_room).toBe(response.court_room);
        expect(result.court_name).toBe(response.court_address);
        expect(result.created_date).toEqual(response.created_date);
        expect(result.updated_by).toBe(response.last_edit_by);
        expect(result.updated_date).toEqual(response.last_edit_date);
        expect(result.status).toBe(response.status.toString());
        expect(result.audio_recording_required).toBe(response.audio_recording_required);
        expect(result.supplier).toBe(response.conference_supplier);
        expect(result.judge.displayName).toBe(response.judge_name);
        expect(result.groupId).toBe(response.group_id);
    });
});

describe('mapParticipantResponseToParticipantModel', () => {
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
        judgeParticipant.hearing_role_name = null;
        judgeParticipant.user_role_name = 'Judge';
        judgeParticipant.interpreter_language = null;
        participants.push(judgeParticipant);

        const model = mapParticipantResponseToParticipantModel(participants);

        expect(model[0].title).toEqual(participant.title);
        expect(model[0].first_name).toEqual(participant.first_name);
        expect(model[0].middle_names).toEqual(participant.middle_names);
        expect(model[0].last_name).toEqual(participant.last_name);
        expect(model[0].username).toEqual(participant.username);
        expect(model[0].display_name).toEqual(participant.display_name);
        expect(model[0].email).toEqual(participant.contact_email);
        expect(model[0].phone).toEqual(participant.telephone_number);
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
        expect(model[1].hearing_role_name).toEqual(judgeParticipant.hearing_role_name);
        expect(model[1].is_judge).toBeTrue();
        expect(model[1].interpretation_language).toBeNull();
    });
});

describe('mapEndpointResponseToEndpointModel', () => {
    it('should map EndpointResponse to EndpointModel', () => {
        const endpoints: EndpointResponse[] = [];
        const endpoint = new EndpointResponse();
        endpoint.display_name = 'endpoint 001';
        endpoint.interpreter_language = null;
        endpoints.push(endpoint);

        const model = mapEndpointResponseToEndpointModel(endpoints, []);
        expect(model[0].displayName).toEqual(endpoint.display_name);
        expect(model[0].interpretationLanguage).toBeNull();
    });
});

describe('mapLinkedParticipantResponseToLinkedParticipantModel', () => {
    it('should map LinkedParticipantResponse to LinkedParticipantModel', () => {
        const linkedParticipants: LinkedParticipantResponse[] = [];
        const linkedParticipant = new LinkedParticipantResponse();
        linkedParticipant.type = LinkedParticipantType.Interpreter;
        linkedParticipant.linked_id = '100';
        linkedParticipants.push(linkedParticipant);

        const model = mapLinkedParticipantResponseToLinkedParticipantModel(linkedParticipants);
        expect(model[0].linkType).toEqual(linkedParticipant.type);
        expect(model[0].linkedParticipantId).toEqual(linkedParticipant.linked_id);
    });
});

function createSingleDayHearing(): HearingDetailsResponse {
    const hearing = new HearingDetailsResponse();
    hearing.id = '123';
    hearing.scheduled_date_time = new Date();
    hearing.scheduled_duration = 90;
    hearing.hearing_venue_code = 'venue-code';
    hearing.hearing_venue_name = 'venue-name';
    hearing.service_id = 'service-id';
    hearing.case_type_name = 'case-type-name';
    hearing.cases = createCases();
    hearing.participants = createParticipants();
    hearing.judiciary_participants = createJudiciaryParticipants();
    hearing.hearing_room_name = 'room-name';
    hearing.other_information = '|OtherInformation|Other info';
    hearing.created_date = new Date();
    hearing.created_by = 'created-by@email.com';
    hearing.updated_by = 'System';
    hearing.updated_date = new Date();
    hearing.confirmed_by = 'System';
    hearing.confirmed_date = new Date();
    hearing.status = BookingStatus.Created;
    hearing.audio_recording_required = true;
    hearing.cancel_reason = 'cancel-reason';
    hearing.endpoints = createEndpoints();
    hearing.group_id = null;
    hearing.conference_supplier = VideoSupplier.Vodafone;
    hearing.allocated_to_username = 'Not Required';
    return hearing;
}

function createMultiDayHearing(): HearingDetailsResponse {
    const hearing = createSingleDayHearing();
    hearing.group_id = 'group-id';
    hearing.hearings_in_group = createHearingsInGroup(hearing, 3);

    const lastDay = hearing.hearings_in_group[hearing.hearings_in_group.length - 1];
    hearing.multi_day_hearing_last_day_scheduled_date_time = lastDay.scheduled_date_time;
    hearing.hearings_in_group.forEach(hearingInGroup => {
        hearingInGroup.multi_day_hearing_last_day_scheduled_date_time = lastDay.scheduled_date_time;
    });

    return hearing;
}

function createHearingsInGroup(originalHearing: HearingDetailsResponse, numberOfDays: number): HearingDetailsResponse[] {
    const hearingsInGroup: HearingDetailsResponse[] = [];
    const day1 = createSingleDayHearing();
    day1.group_id = originalHearing.group_id;
    hearingsInGroup.push(day1);
    if (numberOfDays > 1) {
        for (let i = 2; i <= numberOfDays; i++) {
            const subsequentDay = createSingleDayHearing();
            subsequentDay.id = `day-${i}-id`;
            subsequentDay.scheduled_date_time.setDate(subsequentDay.scheduled_date_time.getDate() + i - 1);
            subsequentDay.group_id = originalHearing.group_id;
            hearingsInGroup.push(subsequentDay);
        }
    }
    return hearingsInGroup;
}

function createCases(): CaseResponse[] {
    const cases: CaseResponse[] = [];

    const caseResponse = new CaseResponse();
    caseResponse.number = 'case-number';
    caseResponse.name = 'case-name';
    caseResponse.is_lead_case = true;
    cases.push(caseResponse);

    return cases;
}

function createParticipants(): ParticipantResponse[] {
    const participants: ParticipantResponse[] = [];
    const applicantExternalRefId = 'applicant-external-ref-id';
    const appellantExternalRefId = 'appellant-external-ref-id';

    const applicant = new ParticipantResponse();
    applicant.id = 'applicant-id';
    applicant.external_reference_id = applicantExternalRefId;
    applicant.display_name = 'Applicant';
    applicant.hearing_role_name = 'Applicant';
    applicant.hearing_role_code = 'APPL';
    applicant.user_role_name = 'Individual';
    applicant.title = 'Mr';
    applicant.first_name = 'ApplicantFirstName';
    applicant.middle_names = 'ApplicantMiddleName';
    applicant.last_name = 'ApplicantLastName';
    applicant.contact_email = 'applicant-contact-email@email.com';
    applicant.telephone_number = '123456789';
    applicant.username = 'applicant-username@email.com';
    applicant.organisation = 'org';
    applicant.screening_requirement = new ScreeningResponse();
    applicant.screening_requirement.type = ScreeningType.Specific;
    applicant.screening_requirement.protect_from = [appellantExternalRefId];
    participants.push(applicant);

    const appellant = new ParticipantResponse();
    appellant.id = 'appellant-id';
    appellant.external_reference_id = appellantExternalRefId;
    appellant.display_name = 'Appellant';
    appellant.hearing_role_name = 'Appellant';
    appellant.hearing_role_code = 'APEL';
    appellant.user_role_name = 'Individual';
    appellant.title = 'Mr';
    appellant.first_name = 'AppellantFirstName';
    appellant.middle_names = 'AppellantMiddleName';
    appellant.last_name = 'AppellantLastName';
    appellant.contact_email = 'appellant-contact-email@email.com';
    appellant.telephone_number = '123456789';
    appellant.username = 'appellant-username@email.com';
    appellant.organisation = 'org2';
    appellant.interpreter_language = new AvailableLanguageResponse();
    appellant.interpreter_language.code = 'bfi';
    appellant.interpreter_language.description = 'British Sign Language (BSL)';
    appellant.interpreter_language.type = InterprepretationType.Sign;
    participants.push(appellant);

    const interpeter = new ParticipantResponse();
    interpeter.id = 'interpreter-id';
    interpeter.external_reference_id = 'interpreter-external-ref-id';
    interpeter.display_name = 'Interpreter';
    interpeter.hearing_role_name = 'Interpreter';
    interpeter.hearing_role_code = 'INTP';
    interpeter.user_role_name = 'Individual';
    interpeter.title = 'Mr';
    interpeter.first_name = 'InterpreterFirstName';
    interpeter.middle_names = 'InterpreterMiddleName';
    interpeter.last_name = 'InterpreterLastName';
    interpeter.contact_email = 'interpreter-contact-email@email.com';
    interpeter.telephone_number = '123456789';
    interpeter.username = 'interpreter-username@email.com';
    interpeter.organisation = 'org3';
    interpeter.interpreter_language = new AvailableLanguageResponse();
    interpeter.interpreter_language.code = 'bfi';
    interpeter.interpreter_language.description = 'British Sign Language (BSL)';
    interpeter.interpreter_language.type = InterprepretationType.Sign;
    participants.push(interpeter);

    const defenceCounsel = new ParticipantResponse();
    defenceCounsel.id = DEFENCE_COUNSEL_ID;
    defenceCounsel.external_reference_id = 'defence-counsel-external-ref-id';
    defenceCounsel.display_name = 'Defence Counsel';
    defenceCounsel.hearing_role_name = 'Defence Counsel';
    defenceCounsel.hearing_role_code = 'DECO';
    defenceCounsel.user_role_name = 'Representative';
    defenceCounsel.title = 'Mr';
    defenceCounsel.first_name = 'DefenceCounselFirstName';
    defenceCounsel.middle_names = 'DefenceCounselMiddleName';
    defenceCounsel.last_name = 'DefenceCounselLastName';
    defenceCounsel.contact_email = 'defence-counsel-contact-email@email.com';
    defenceCounsel.telephone_number = '123456789';
    defenceCounsel.username = 'defence-counsel-username@email.com';
    defenceCounsel.organisation = 'org4';
    defenceCounsel.representee = applicant.display_name;
    participants.push(defenceCounsel);

    return participants;
}

function createJudiciaryParticipants(): JudiciaryParticipantResponse[] {
    const judiciaryParticipants: JudiciaryParticipantResponse[] = [];

    const judge = new JudiciaryParticipantResponse();
    judge.title = 'Mr';
    judge.first_name = 'JudgeFirstName';
    judge.last_name = 'JudgeLastName';
    judge.full_name = 'JudgeFullName';
    judge.email = 'judge@email.com';
    judge.work_phone = '123456789';
    judge.personal_code = 'judge-personal-code';
    judge.role_code = 'Judge';
    judge.display_name = 'JudgeDisplayName';
    judge.is_generic = true;
    judge.optional_contact_email = 'judge-optional-contact-email';
    judge.optional_contact_telephone = 'judge-optional-contact-telephone';
    judiciaryParticipants.push(judge);

    const panelMember = new JudiciaryParticipantResponse();
    panelMember.title = 'Mr';
    panelMember.first_name = 'PMFirstName';
    panelMember.last_name = 'PMLastName';
    panelMember.full_name = 'PMFullName';
    panelMember.email = 'pm@email.com';
    panelMember.work_phone = '123456789';
    panelMember.personal_code = 'pm-personal-code';
    panelMember.role_code = 'PanelMember';
    panelMember.display_name = 'PMDisplayName';
    panelMember.is_generic = true;
    panelMember.optional_contact_email = 'pm-optional-contact-email';
    panelMember.optional_contact_telephone = 'pm-optional-contact-telephone';
    judiciaryParticipants.push(panelMember);

    return judiciaryParticipants;
}

function createEndpoints(): EndpointResponse[] {
    const endpoints: EndpointResponse[] = [];

    const endpoint = new EndpointResponse();
    endpoint.id = 'endpoint-id';
    endpoint.external_reference_id = 'endpoint-external-ref-id';
    endpoint.display_name = 'EndpointDisplayName';
    endpoint.sip = 'sip';
    endpoint.pin = '4634';
    endpoint.defence_advocate_id = DEFENCE_COUNSEL_ID;
    endpoints.push(endpoint);

    return endpoints;
}

function verifyVHBooking(vhBooking: VHBooking, hearing: HearingDetailsResponse) {
    expect(vhBooking.hearing_id).toBe(hearing.id);
    expect(vhBooking.scheduled_date_time).toEqual(hearing.scheduled_date_time);
    expect(vhBooking.scheduled_duration).toBe(hearing.scheduled_duration);
    expect(vhBooking.court_code).toBe(hearing.hearing_venue_code);
    expect(vhBooking.court_name).toBe(hearing.hearing_venue_name);
    expect(vhBooking.case_type_service_id).toBe(hearing.service_id);
    expect(vhBooking.case_type).toBe(hearing.case_type_name);
    expect(vhBooking.case).toEqual(mapCaseResponseToCaseModel(hearing.cases)[0]);
    expect(vhBooking.participants).toEqual(mapParticipantResponseToParticipantModel(hearing.participants));
    expect(vhBooking.judiciaryParticipants).toEqual(
        hearing.judiciary_participants.map(judiciaryParticipant => JudicialMemberDto.fromJudiciaryParticipantResponse(judiciaryParticipant))
    );
    expect(vhBooking.court_room).toBe(hearing.hearing_room_name);
    expect(vhBooking.other_information).toBe(hearing.other_information);
    expect(vhBooking.created_date).toEqual(hearing.created_date);
    expect(vhBooking.created_by).toBe(hearing.created_by);
    expect(vhBooking.updated_by).toBe(hearing.updated_by);
    expect(vhBooking.updated_date).toEqual(hearing.updated_date);
    expect(vhBooking.status).toBe(hearing.status);
    expect(vhBooking.audio_recording_required).toBe(hearing.audio_recording_required);
    expect(vhBooking.endpoints).toEqual(mapEndpointResponseToEndpointModel(hearing.endpoints, hearing.participants));
    expect(vhBooking.originalScheduledDateTime).toEqual(hearing.scheduled_date_time);
    expect(vhBooking.supplier).toBe(hearing.conference_supplier);
    const expectedJudge = vhBooking.judiciaryParticipants.find(jp => jp.roleCode === Constants.Judge) ?? null;
    expect(vhBooking.judge).toEqual(expectedJudge);
}
