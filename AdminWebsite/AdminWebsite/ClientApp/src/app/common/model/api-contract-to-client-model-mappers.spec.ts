import {
    AvailableLanguageResponse,
    BookingsHearingResponse,
    BookingStatus,
    BookingStatus2,
    CaseResponse,
    EndpointResponse,
    HearingDetailsResponse,
    InterprepretationType,
    JudgeAccountType,
    JudgeResponse,
    JudiciaryParticipantResponse,
    LinkedParticipantResponse,
    LinkedParticipantType,
    ParticipantResponse,
    PersonResponseV2,
    ScreeningResponse,
    ScreeningType,
    VideoSupplier
} from 'src/app/services/clients/api-client';
import { VHBooking } from './vh-booking';
import {
    mapBookingsHearingResponseToVHBooking,
    mapCaseResponseToCaseModel,
    mapEndpointResponseToEndpointModel,
    mapHearingToVHBooking,
    mapJudgeResponseToVHParticipant,
    mapJudicialMemberDtoToVHParticipant,
    mapLinkedParticipantResponseToLinkedParticipantModel,
    mapParticipantResponseToVHParticipant,
    mapPersonResponseToVHParticipant
} from './api-contract-to-client-model-mappers';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { Constants } from '../constants';
import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { mapScreeningResponseToScreeningDto } from 'src/app/booking/screening/screening.model';
import { CaseModel } from './case.model';
import { VHParticipant } from './vh-participant';

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
                hearingInGroup.scheduledDateTime.getTime() === hearing.multi_day_hearing_last_day_scheduled_date_time.getTime();
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
        expect(result.hearingId).toBe(response.hearing_id);
        expect(result.scheduledDateTime).toEqual(response.scheduled_date_time);
        expect(result.scheduledDuration).toBe(response.scheduled_duration);
        expect(result.case).toEqual(new CaseModel(response.hearing_name, response.hearing_number));
        expect(result.createdBy).toBe(response.created_by);
        expect(result.caseType).toBe(response.case_type_name);
        expect(result.courtRoom).toBe(response.court_room);
        expect(result.courtName).toBe(response.court_address);
        expect(result.createdDate).toEqual(response.created_date);
        expect(result.updatedBy).toBe(response.last_edit_by);
        expect(result.updatedDate).toEqual(response.last_edit_date);
        expect(result.status).toBe(response.status.toString());
        expect(result.audioRecordingRequired).toBe(response.audio_recording_required);
        expect(result.supplier).toBe(response.conference_supplier);
        expect(result.judge.displayName).toBe(response.judge_name);
        expect(result.groupId).toBe(response.group_id);
    });
});

describe('mapParticipantResponseToVHParticipant', () => {
    it('should map ParticipantResponse to VHParticipant', () => {
        // Arrange
        const participant = new ParticipantResponse();
        participant.id = 'id';
        participant.external_reference_id = 'external-ref-id';
        participant.title = 'title';
        participant.first_name = 'first-name';
        participant.last_name = 'last-name';
        participant.middle_names = 'middle-names';
        participant.display_name = 'display-name';
        participant.username = 'username';
        participant.contact_email = 'contact-email';
        participant.hearing_role_name = 'hearing-role-name';
        participant.hearing_role_code = 'hearing-role-code';
        participant.telephone_number = 'telephone-number';
        participant.representee = 'representee';
        participant.organisation = 'organisation';
        participant.linked_participants = createLinkedParticipants();
        participant.user_role_name = 'user-role-name';
        participant.interpreter_language = new AvailableLanguageResponse({
            code: 'code',
            description: 'description',
            type: InterprepretationType.Verbal
        });
        participant.screening_requirement = new ScreeningResponse({
            protect_from: ['protect-from'],
            type: ScreeningType.Specific
        });

        // Act
        const result = mapParticipantResponseToVHParticipant(participant);

        // Assert
        expect(result.id).toBe(participant.id);
        expect(result.externalReferenceId).toBe(participant.external_reference_id);
        expect(result.title).toBe(participant.title);
        expect(result.firstName).toBe(participant.first_name);
        expect(result.lastName).toBe(participant.last_name);
        expect(result.middleNames).toBe(participant.middle_names);
        expect(result.displayName).toBe(participant.display_name);
        expect(result.username).toBe(participant.username);
        expect(result.email).toBe(participant.contact_email);
        expect(result.hearingRoleName).toBe(participant.hearing_role_name);
        expect(result.hearingRoleCode).toBe(participant.hearing_role_code);
        expect(result.phone).toBe(participant.telephone_number);
        expect(result.representee).toBe(participant.representee);
        expect(result.company).toBe(participant.organisation);
        expect(result.linkedParticipants).toEqual(mapLinkedParticipantResponseToLinkedParticipantModel(participant.linked_participants));
        expect(result.userRoleName).toBe(participant.user_role_name);
        expect(result.contactEmail).toBe(participant.contact_email);
        expect(result.interpretation_language).toEqual(
            InterpreterSelectedDto.fromAvailableLanguageResponse(participant.interpreter_language)
        );
        expect(result.screening).toEqual(mapScreeningResponseToScreeningDto(participant.screening_requirement));
    });
});

describe('mapEndpointResponseToEndpointModel', () => {
    it('should map EndpointResponse to EndpointModel', () => {
        // Arrange
        const endpoints: EndpointResponse[] = [];
        const endpoint = new EndpointResponse();
        endpoint.display_name = 'endpoint 001';
        endpoint.interpreter_language = null;
        endpoints.push(endpoint);

        // Act
        const model = mapEndpointResponseToEndpointModel(endpoints, []);

        // Assert
        expect(model[0].displayName).toEqual(endpoint.display_name);
        expect(model[0].interpretationLanguage).toBeNull();
    });
});

describe('mapLinkedParticipantResponseToLinkedParticipantModel', () => {
    it('should map LinkedParticipantResponse to LinkedParticipantModel', () => {
        // Arrange
        const linkedParticipants = createLinkedParticipants();

        // Act
        const model = mapLinkedParticipantResponseToLinkedParticipantModel(linkedParticipants);

        // Assert
        expect(model[0].linkType).toEqual(linkedParticipants[0].type);
        expect(model[0].linkedParticipantId).toEqual(linkedParticipants[0].linked_id);
    });
});

describe('mapPersonResponseToVHParticipant', () => {
    let personResponse: PersonResponseV2;

    beforeEach(() => {
        personResponse = new PersonResponseV2({
            id: 'id',
            title: 'title',
            first_name: 'firstName',
            middle_names: 'middleNames',
            last_name: 'lastName',
            contact_email: 'contactEmail@email.com',
            telephone_number: 'telephoneNumber',
            username: 'username',
            organisation: 'organisation'
        });
    });

    it('should map PersonResponse to VHParticipant', () => {
        // Arrange & Act
        const result = mapPersonResponseToVHParticipant(personResponse);

        // Assert
        expect(result.id).toBe(personResponse.id);
        expect(result.title).toBe(personResponse.title);
        expect(result.firstName).toBe(personResponse.first_name);
        expect(result.middleNames).toBe(personResponse.middle_names);
        expect(result.lastName).toBe(personResponse.last_name);
        expect(result.email).toBe(personResponse.contact_email);
        expect(result.phone).toBe(personResponse.telephone_number);
        expect(result.representee).toBe('');
        expect(result.company).toBe(personResponse.organisation);
        expect(result.isJudiciaryMember).toBeFalse();
        expect(result.interpretation_language).toBeNull();
    });

    it('should map PersonResponse to VHParticipant without title', () => {
        // Arrange
        personResponse.title = null;

        // Act
        const result = mapPersonResponseToVHParticipant(personResponse);

        // Assert
        expect(result.title).toBe('');
    });

    it('should map PersonResponse to VHParticipant without contact email', () => {
        // Arrange
        personResponse.contact_email = null;

        // Act
        const result = mapPersonResponseToVHParticipant(personResponse);

        // Assert
        expect(result.email).toBe(personResponse.username);
    });
});

describe('mapJudgeResponseToVHParticipant', () => {
    let judgeResponse: JudgeResponse;

    beforeEach(() => {
        judgeResponse = new JudgeResponse({
            first_name: 'firstName',
            last_name: 'lastName',
            display_name: 'displayName',
            email: 'email',
            contact_email: '',
            account_type: JudgeAccountType.Courtroom
        });
    });

    it('should map JudgeResponse to VHParticipant', () => {
        // Arrange & Act
        const result = mapJudgeResponseToVHParticipant(judgeResponse);

        // Assert
        expect(result.firstName).toBe(judgeResponse.first_name);
        expect(result.lastName).toBe(judgeResponse.last_name);
        expect(result.displayName).toBe(judgeResponse.display_name);
        expect(result.email).toBe(judgeResponse.contact_email);
        expect(result.username).toBe(judgeResponse.email);
        expect(result.isCourtroomAccount).toBeTrue();
        expect(result.isJudiciaryMember).toBeFalse();
        expect(result.interpretation_language).toBeNull();
    });

    it('should map JudgeResponse to VHParticipant without contact email', () => {
        // Arrange
        judgeResponse.contact_email = null;

        // Act
        const result = mapJudgeResponseToVHParticipant(judgeResponse);

        // Assert
        expect(result.email).toBe(judgeResponse.email);
    });

    it('should map JudgeResponse to VHParticipant for non-courtroom account type', () => {
        // Arrange
        judgeResponse.account_type = JudgeAccountType.Judiciary;

        // Act
        const result = mapJudgeResponseToVHParticipant(judgeResponse);

        // Assert
        expect(result.isCourtroomAccount).toBeFalse();
    });
});

describe('mapJudicialMemberDtoToVHParticipant', () => {
    let dto: JudicialMemberDto;

    beforeEach(() => {
        dto = new JudicialMemberDto('firstName', 'lastName', 'fullName', 'email', 'telephone', 'personalCode', true, 'displayName');
        dto.roleCode = 'Judge';
        const availableLanguage = new AvailableLanguageResponse({
            code: 'code',
            description: 'description',
            type: InterprepretationType.Verbal
        });
        dto.interpretationLanguage = InterpreterSelectedDto.fromAvailableLanguageResponse(availableLanguage);
    });

    it('should map JudicialMemberDto to VHParticipant when isJudge is true', () => {
        // Arrange
        dto.roleCode = 'Judge';
        const isJudge = true;

        // Act
        const result = mapJudicialMemberDtoToVHParticipant(dto, isJudge);

        // Assert
        verifyVHParticipantFromJudicialMemberDto(result, dto);
        expect(result.hearingRoleName).toBe('Judge');
        expect(result.userRoleName).toBe('Judge');
        expect(result.hearingRoleCode).toBe('Judge');
    });

    it('should map JudicialMemberDto to VHParticipant when isJudge is false', () => {
        // Arrange
        dto.roleCode = 'PanelMember';
        const isJudge = false;

        // Act
        const result = mapJudicialMemberDtoToVHParticipant(dto, isJudge);

        // Assert
        verifyVHParticipantFromJudicialMemberDto(result, dto);
        expect(result.hearingRoleName).toBe('Panel Member');
        expect(result.userRoleName).toBe('PanelMember');
        expect(result.hearingRoleCode).toBe('PanelMember');
    });

    function verifyVHParticipantFromJudicialMemberDto(vhParticipant: VHParticipant, judicialMemberDto: JudicialMemberDto) {
        expect(vhParticipant.firstName).toBe(judicialMemberDto.firstName);
        expect(vhParticipant.lastName).toBe(judicialMemberDto.lastName);
        expect(vhParticipant.username).toBe(judicialMemberDto.email);
        expect(vhParticipant.email).toBe(judicialMemberDto.email);
        expect(vhParticipant.isExistPerson).toBeTrue();
        expect(vhParticipant.isJudiciaryMember).toBeTrue();
        expect(vhParticipant.phone).toBe(judicialMemberDto.telephone);
        expect(vhParticipant.displayName).toBe(judicialMemberDto.displayName);
        expect(vhParticipant.interpretation_language).toEqual(judicialMemberDto.interpretationLanguage);
    }
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

function createLinkedParticipants(): LinkedParticipantResponse[] {
    const linkedParticipants: LinkedParticipantResponse[] = [];

    const linkedParticipant = new LinkedParticipantResponse();
    linkedParticipant.type = LinkedParticipantType.Interpreter;
    linkedParticipant.linked_id = '100';
    linkedParticipants.push(linkedParticipant);

    return linkedParticipants;
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
    expect(vhBooking.hearingId).toBe(hearing.id);
    expect(vhBooking.scheduledDateTime).toEqual(hearing.scheduled_date_time);
    expect(vhBooking.scheduledDuration).toBe(hearing.scheduled_duration);
    expect(vhBooking.courtCode).toBe(hearing.hearing_venue_code);
    expect(vhBooking.courtName).toBe(hearing.hearing_venue_name);
    expect(vhBooking.caseTypeServiceId).toBe(hearing.service_id);
    expect(vhBooking.caseType).toBe(hearing.case_type_name);
    expect(vhBooking.case).toEqual(mapCaseResponseToCaseModel(hearing.cases)[0]);
    vhBooking.participants.forEach(participant => {});
    expect(vhBooking.participants).toEqual(hearing.participants.map(participant => mapParticipantResponseToVHParticipant(participant)));
    expect(vhBooking.judiciaryParticipants).toEqual(
        hearing.judiciary_participants.map(judiciaryParticipant => JudicialMemberDto.fromJudiciaryParticipantResponse(judiciaryParticipant))
    );
    expect(vhBooking.courtRoom).toBe(hearing.hearing_room_name);
    expect(vhBooking.otherInformation).toBe(hearing.other_information);
    expect(vhBooking.createdDate).toEqual(hearing.created_date);
    expect(vhBooking.createdBy).toBe(hearing.created_by);
    expect(vhBooking.updatedBy).toBe(hearing.updated_by);
    expect(vhBooking.updatedDate).toEqual(hearing.updated_date);
    expect(vhBooking.status).toBe(hearing.status);
    expect(vhBooking.audioRecordingRequired).toBe(hearing.audio_recording_required);
    expect(vhBooking.endpoints).toEqual(mapEndpointResponseToEndpointModel(hearing.endpoints, hearing.participants));
    expect(vhBooking.originalScheduledDateTime).toEqual(hearing.scheduled_date_time);
    expect(vhBooking.supplier).toBe(hearing.conference_supplier);
    const expectedJudge = vhBooking.judiciaryParticipants.find(jp => jp.roleCode === Constants.Judge) ?? null;
    expect(vhBooking.judge).toEqual(expectedJudge);
    expect(vhBooking.allocatedTo).toBe(hearing.allocated_to_username);
    expect(vhBooking.confirmedBy).toBe(hearing.confirmed_by);
    expect(vhBooking.confirmedDate).toEqual(hearing.confirmed_date);
}
