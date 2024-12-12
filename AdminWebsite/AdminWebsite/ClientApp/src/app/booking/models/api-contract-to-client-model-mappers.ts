import {
    AvailableLanguageResponse,
    CaseResponse,
    EndpointResponse,
    HearingDetailsResponse,
    InterprepretationType,
    ParticipantResponse,
    ScreeningResponse,
    ScreeningType as ApiScreeningType,
    JudiciaryParticipantResponse,
    LinkedParticipantResponse
} from 'src/app/services/clients/api-client';
import {
    VHBooking,
    VHCase,
    VHEndpoint,
    VHInterpreterSelected,
    VHJudicaryRoleCode,
    VHJudiciaryParticipant,
    VHLinkedParticipant,
    VHParticipant,
    VHScreening
} from './vh-booking';
import { Constants } from 'src/app/common/constants';
import { v4 as uuid } from 'uuid';

export function mapHearingToVHBooking(hearing: HearingDetailsResponse): VHBooking {
    return {
        hearingId: hearing.id,
        scheduledDateTime: new Date(hearing.scheduled_date_time),
        scheduledDuration: hearing.scheduled_duration,
        case: mapCaseToVHCase(hearing.cases[0]),
        participants: hearing.participants?.map(participant => mapParticipantToVHParticipant(participant)),
        judiciaryParticipants: hearing.judiciary_participants?.map(judiciaryParticipant =>
            mapJudiciaryParticipantToVHJudiciaryParticipant(judiciaryParticipant)
        ),
        createdBy: hearing.created_by,
        caseType: hearing.case_type_name,
        caseTypeServiceId: hearing.service_id,
        otherInformation: hearing.other_information,
        courtRoom: hearing.hearing_room_name,
        courtName: hearing.hearing_venue_name,
        courtCode: hearing.hearing_venue_code,
        createdDate: new Date(hearing.created_date),
        updatedBy: hearing.updated_by,
        updatedDate: new Date(hearing.updated_date),
        status: hearing.status,
        audioRecordingRequired: hearing.audio_recording_required,
        endpoints: hearing.endpoints?.map(endpoint => mapEndpointToVHEndpoint(endpoint, hearing.participants)),
        isMultiDay: hearing.group_id !== null,
        multiDayHearingLastDayScheduledDateTime: hearing.multi_day_hearing_last_day_scheduled_date_time,
        hearingsInGroup: hearing.hearings_in_group?.map(hearingInGroup => mapHearingToVHBooking(hearingInGroup)),
        originalScheduledDateTime: hearing.scheduled_date_time,
        supplier: hearing.conference_supplier
    };
}

export function mapCaseToVHCase(caseResponse: CaseResponse): VHCase {
    return {
        number: caseResponse.number,
        name: caseResponse.name,
        isLeadCase: caseResponse.is_lead_case
    };
}

export function mapParticipantToVHParticipant(participant: ParticipantResponse): VHParticipant {
    return {
        id: participant.id,
        externalReferenceId: participant.external_reference_id,
        title: participant.title,
        firstName: participant.first_name,
        lastName: participant.last_name,
        middleNames: participant.middle_names,
        displayName: participant.display_name,
        username: participant.username,
        email: participant.contact_email,
        hearingRoleName: participant.hearing_role_name,
        hearingRoleCode: participant.hearing_role_code,
        phone: participant.telephone_number,
        representee: participant.representee,
        company: participant.organisation,
        isJudge: participant.user_role_name === Constants.UserRoles.Judge,
        linkedParticipants: participant.linked_participants?.map(linkedParticipant =>
            mapLinkedParticipantResponseToVHLinkedParticipant(linkedParticipant)
        ),
        userRoleName: participant.user_role_name,
        isStaffMember: participant.user_role_name === Constants.UserRoles.StaffMember,
        interpretationLanguage: mapAvailableLanguageToVHInterpreterSelected(participant.interpreter_language),
        screening: mapScreeningResponseToVHScreening(participant.screening_requirement)
    };
}

export function mapLinkedParticipantResponseToVHLinkedParticipant(linkedParticipant: LinkedParticipantResponse): VHLinkedParticipant {
    return {
        linkType: linkedParticipant.type,
        linkedParticipantId: linkedParticipant.linked_id
    };
}

export function mapJudiciaryParticipantToVHJudiciaryParticipant(
    judiciaryParticipant: JudiciaryParticipantResponse
): VHJudiciaryParticipant {
    return {
        firstName: judiciaryParticipant.first_name,
        lastName: judiciaryParticipant.last_name,
        fullName: judiciaryParticipant.full_name,
        email: judiciaryParticipant.email,
        telephone: judiciaryParticipant.work_phone,
        personalCode: judiciaryParticipant.personal_code,
        isGeneric: judiciaryParticipant.is_generic,
        optionalContactNumber: judiciaryParticipant.optional_contact_telephone,
        optionalContactEmail: judiciaryParticipant.optional_contact_email,
        roleCode: judiciaryParticipant.role_code as VHJudicaryRoleCode,
        displayName: judiciaryParticipant.display_name,
        interpretationLanguage: mapAvailableLanguageToVHInterpreterSelected(judiciaryParticipant.interpreter_language)
    };
}

export function mapEndpointToVHEndpoint(endpoint: EndpointResponse, participants: ParticipantResponse[]): VHEndpoint {
    const defenceAdvocate = participants.find(p => p.id === endpoint.defence_advocate_id);
    return {
        externalReferenceId: endpoint.external_reference_id || uuid(),
        id: endpoint.id,
        displayName: endpoint.display_name,
        sip: endpoint.sip,
        pin: endpoint.pin,
        defenceAdvocate: defenceAdvocate?.contact_email,
        interpretationLanguage: mapAvailableLanguageToVHInterpreterSelected(endpoint.interpreter_language),
        screening: mapScreeningResponseToVHScreening(endpoint.screening_requirement)
    };
}

export function mapAvailableLanguageToVHInterpreterSelected(availableLanguage: AvailableLanguageResponse): VHInterpreterSelected {
    if (!availableLanguage) {
        return null;
    }

    const interpreterSelected: VHInterpreterSelected = {
        interpreterRequired: true,
        spokenLanguageCode: null,
        spokenLanguageCodeDescription: null,
        signLanguageCode: null,
        signLanguageDescription: null
    };
    switch (availableLanguage.type) {
        case InterprepretationType.Verbal:
            interpreterSelected.spokenLanguageCode = availableLanguage.code;
            interpreterSelected.spokenLanguageCodeDescription = availableLanguage.description;
            break;
        case InterprepretationType.Sign:
            interpreterSelected.signLanguageCode = availableLanguage.code;
            interpreterSelected.signLanguageDescription = availableLanguage.description;
            break;
        default:
            throw new Error(`Unknown interpretation type ${availableLanguage.type}`);
    }

    return interpreterSelected;
}

export function mapScreeningResponseToVHScreening(response: ScreeningResponse): VHScreening {
    if (!response) {
        return undefined;
    }

    const mappedProtectFrom = response.protect_from.map(protectFrom => ({
        externalReferenceId: protectFrom
    }));

    return {
        measureType: response.type === ApiScreeningType.All ? 'All' : 'Specific',
        protectFrom: mappedProtectFrom
    };
}
