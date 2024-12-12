import {
    AvailableLanguageResponse,
    BookingStatus,
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
    mapHearingToVHBooking,
    mapCaseToVHCase,
    mapParticipantToVHParticipant,
    mapLinkedParticipantResponseToVHLinkedParticipant,
    mapAvailableLanguageToVHInterpreterSelected,
    mapScreeningResponseToVHScreening,
    mapJudiciaryParticipantToVHJudiciaryParticipant,
    mapEndpointToVHEndpoint
} from './api-contract-to-client-model-mappers';

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
    });
});

describe('mapCaseToVHCase', () => {
    it('should map case', () => {
        // Arrange
        const caseResponse = createCases()[0];

        // Act
        const result = mapCaseToVHCase(caseResponse);

        // Assert
        expect(result.number).toBe(caseResponse.number);
        expect(result.name).toBe(caseResponse.name);
        expect(result.isLeadCase).toBe(caseResponse.is_lead_case);
    });
});

describe('mapParticipantToVHParticipant', () => {
    it('should map participant', () => {
        // Arrange
        const participant = createParticipants().find(p => p.representee !== null);

        // Act
        const result = mapParticipantToVHParticipant(participant);

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
        expect(result.isJudge).toBe(false);
        expect(result.linkedParticipants).toEqual(
            participant.linked_participants?.map(linkedParticipant => mapLinkedParticipantResponseToVHLinkedParticipant(linkedParticipant))
        );
        expect(result.userRoleName).toBe(participant.user_role_name);
        expect(result.isStaffMember).toBe(false);
        expect(result.interpretationLanguage).toEqual(mapAvailableLanguageToVHInterpreterSelected(participant.interpreter_language));
        expect(result.screening).toEqual(mapScreeningResponseToVHScreening(participant.screening_requirement));
    });
});

describe('mapLinkedParticipantResponseToVHLinkedParticipant', () => {
    it('should map linked participant', () => {
        // Arrange
        const linkedParticipant = new LinkedParticipantResponse();
        linkedParticipant.type = LinkedParticipantType.Interpreter;
        linkedParticipant.linked_id = 'linked-id';

        // Act
        const result = mapLinkedParticipantResponseToVHLinkedParticipant(linkedParticipant);

        // Assert
        expect(result.linkType).toBe(linkedParticipant.type);
        expect(result.linkedParticipantId).toBe(linkedParticipant.linked_id);
    });
});

describe('mapJudiciaryParticipantToVHJudiciaryParticipant', () => {
    it('should map judiciary participant', () => {
        // Arrange
        const judiciaryParticipant = createJudiciaryParticipants()[0];

        // Act
        const result = mapJudiciaryParticipantToVHJudiciaryParticipant(judiciaryParticipant);

        // Assert
        expect(result.firstName).toBe(judiciaryParticipant.first_name);
        expect(result.lastName).toBe(judiciaryParticipant.last_name);
        expect(result.fullName).toBe(judiciaryParticipant.full_name);
        expect(result.email).toBe(judiciaryParticipant.email);
        expect(result.telephone).toBe(judiciaryParticipant.work_phone);
        expect(result.personalCode).toBe(judiciaryParticipant.personal_code);
        expect(result.isGeneric).toBe(judiciaryParticipant.is_generic);
        expect(result.optionalContactNumber).toBe(judiciaryParticipant.optional_contact_telephone);
        expect(result.optionalContactEmail).toBe(judiciaryParticipant.optional_contact_email);
        expect(result.roleCode).toBe(judiciaryParticipant.role_code);
        expect(result.displayName).toBe(judiciaryParticipant.display_name);
        expect(result.interpretationLanguage).toEqual(
            mapAvailableLanguageToVHInterpreterSelected(judiciaryParticipant.interpreter_language)
        );
    });
});

describe('mapEndpointToVHEndpoint', () => {
    it('should map endpoint', () => {
        // Arrange
        const endpoint = createEndpoints()[0];
        const participants = createParticipants();
        const defenceAdvocate = participants.find(p => p.id === endpoint.defence_advocate_id);

        // Act
        const result = mapEndpointToVHEndpoint(endpoint, participants);

        // Assert
        expect(result.id).toBe(endpoint.id);
        expect(result.externalReferenceId).toBe(endpoint.external_reference_id);
        expect(result.displayName).toBe(endpoint.display_name);
        expect(result.sip).toBe(endpoint.sip);
        expect(result.pin).toBe(endpoint.pin);
        expect(result.defenceAdvocate).toBe(defenceAdvocate.contact_email);
        expect(result.interpretationLanguage).toEqual(mapAvailableLanguageToVHInterpreterSelected(endpoint.interpreter_language));
        expect(result.screening).toEqual(mapScreeningResponseToVHScreening(endpoint.screening_requirement));
    });
});

describe('mapAvailableLanguageToVHInterpreterSelected', () => {
    it('should map verbal language', () => {
        // Arrange
        const language = new AvailableLanguageResponse();
        language.code = 'cym';
        language.description = 'Welsh';
        language.type = InterprepretationType.Verbal;

        // Act
        const result = mapAvailableLanguageToVHInterpreterSelected(language);

        // Assert
        expect(result.interpreterRequired).toBe(true);
        expect(result.spokenLanguageCode).toBe(language.code);
        expect(result.spokenLanguageCodeDescription).toBe(language.description);
        expect(result.signLanguageCode).toBeNull();
        expect(result.signLanguageDescription).toBeNull();
    });

    it('should map sign language', () => {
        const language = new AvailableLanguageResponse();
        language.code = 'bfi';
        language.description = 'British Sign Language (BSL)';
        language.type = InterprepretationType.Sign;

        // Act
        const result = mapAvailableLanguageToVHInterpreterSelected(language);

        // Assert
        expect(result.interpreterRequired).toBe(true);
        expect(result.signLanguageCode).toBe(language.code);
        expect(result.signLanguageDescription).toBe(language.description);
        expect(result.spokenLanguageCode).toBeNull();
        expect(result.spokenLanguageCodeDescription).toBeNull();
    });

    it('should return null when no language specified', () => {
        // Arrange & Act
        const result = mapAvailableLanguageToVHInterpreterSelected(null);

        // Assert
        expect(result).toBeNull();
    });

    it('should throw error when invalid language specified', () => {
        // Arrange
        const language = new AvailableLanguageResponse();
        language.code = 'cym';
        language.description = 'Welsh';
        language.type = 'invalid' as InterprepretationType;

        // Act & Assert
        expect(() => mapAvailableLanguageToVHInterpreterSelected(language)).toThrowError(`Unknown interpretation type ${language.type}`);
    });
});

describe('mapScreeningResponseToVHScreening', () => {
    it('should map screening for All type', () => {
        // Arrange
        const screening = new ScreeningResponse();
        screening.protect_from = ['external-ref-id-1', 'external-ref-id-2'];
        screening.type = ScreeningType.All;

        // Act
        const result = mapScreeningResponseToVHScreening(screening);

        // Assert
        expect(result.measureType).toBe('All');
    });

    it('should map screening for Specific type', () => {
        // Arrange
        const screening = new ScreeningResponse();
        screening.protect_from = ['external-ref-id-1', 'external-ref-id-2'];
        screening.type = ScreeningType.Specific;

        // Act
        const result = mapScreeningResponseToVHScreening(screening);

        // Assert
        expect(result.measureType).toBe('Specific');
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
    expect(vhBooking.hearingId).toBe(hearing.id);
    expect(vhBooking.scheduledDateTime).toEqual(hearing.scheduled_date_time);
    expect(vhBooking.scheduledDuration).toBe(hearing.scheduled_duration);
    expect(vhBooking.courtCode).toBe(hearing.hearing_venue_code);
    expect(vhBooking.courtName).toBe(hearing.hearing_venue_name);
    expect(vhBooking.caseTypeServiceId).toBe(hearing.service_id);
    expect(vhBooking.caseType).toBe(hearing.case_type_name);
    expect(vhBooking.case).toEqual(mapCaseToVHCase(hearing.cases[0]));
    expect(vhBooking.participants).toEqual(hearing.participants.map(participant => mapParticipantToVHParticipant(participant)));
    expect(vhBooking.judiciaryParticipants).toEqual(
        hearing.judiciary_participants.map(judiciaryParticipant => mapJudiciaryParticipantToVHJudiciaryParticipant(judiciaryParticipant))
    );
    expect(vhBooking.courtRoom).toBe(hearing.hearing_room_name);
    expect(vhBooking.otherInformation).toBe(hearing.other_information);
    expect(vhBooking.createdDate).toEqual(hearing.created_date);
    expect(vhBooking.createdBy).toBe(hearing.created_by);
    expect(vhBooking.updatedBy).toBe(hearing.updated_by);
    expect(vhBooking.updatedDate).toEqual(hearing.updated_date);
    expect(vhBooking.status).toBe(hearing.status);
    expect(vhBooking.audioRecordingRequired).toBe(hearing.audio_recording_required);
    expect(vhBooking.endpoints).toEqual(hearing.endpoints.map(endpoint => mapEndpointToVHEndpoint(endpoint, hearing.participants)));
    expect(vhBooking.originalScheduledDateTime).toEqual(hearing.scheduled_date_time);
    expect(vhBooking.supplier).toBe(hearing.conference_supplier);
}
