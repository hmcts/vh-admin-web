import {
    BookingsHearingResponse,
    CaseResponse,
    CaseTypeResponse,
    EndpointResponse,
    HearingDetailsResponse,
    JudgeAccountType,
    JudgeResponse,
    LinkedParticipantResponse,
    ParticipantResponse,
    PersonResponseV2
} from 'src/app/services/clients/api-client';
import { VHBooking } from './vh-booking';
import { CaseModel } from './case.model';
import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { mapScreeningResponseToScreeningDto } from 'src/app/booking/screening/screening.model';
import { LinkedParticipantModel } from './linked-participant.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { EndpointModel } from './endpoint.model';
import { VHParticipant } from './vh-participant';
import { CaseTypeModel } from './case-type.model';

export function mapHearingToVHBooking(hearing: HearingDetailsResponse): VHBooking {
    return new VHBooking({
        hearingId: hearing.id,
        scheduledDateTime: new Date(hearing.scheduled_date_time),
        scheduledDuration: hearing.scheduled_duration,
        case: mapCaseResponseToCaseModel(hearing.cases)[0],
        participants: hearing.participants?.map(participant => mapParticipantResponseToVHParticipant(participant)),
        judiciaryParticipants: hearing.judiciary_participants?.map(judiciaryParticipant =>
            JudicialMemberDto.fromJudiciaryParticipantResponse(judiciaryParticipant)
        ),
        createdBy: hearing.created_by,
        caseType: mapCaseTypeResponseToCaseTypeModel(hearing.case_type),
        otherInformation: hearing.other_information,
        courtRoom: hearing.hearing_room_name,
        courtName: hearing.hearing_venue_name,
        courtCode: hearing.hearing_venue_code,
        createdDate: new Date(hearing.created_date),
        updatedBy: hearing.updated_by,
        updatedDate: new Date(hearing.updated_date),
        status: hearing.status,
        audioRecordingRequired: hearing.audio_recording_required,
        endpoints: mapEndpointResponseToEndpointModel(hearing.endpoints, hearing.participants),
        isMultiDay: hearing.group_id !== null && hearing.group_id !== undefined,
        multiDayHearingLastDayScheduledDateTime: hearing.multi_day_hearing_last_day_scheduled_date_time,
        hearingsInGroup: hearing.hearings_in_group?.map(hearingInGroup => mapHearingToVHBooking(hearingInGroup)),
        originalScheduledDateTime: hearing.scheduled_date_time,
        supplier: hearing.conference_supplier,
        isLastDayOfMultiDayHearing:
            hearing.scheduled_date_time.getTime() === hearing.multi_day_hearing_last_day_scheduled_date_time?.getTime(),
        groupId: hearing.group_id,
        allocatedTo: hearing.allocated_to_username,
        confirmedBy: hearing.confirmed_by,
        confirmedDate: hearing.confirmed_date
    });
}

export function mapBookingsHearingResponseToVHBooking(response: BookingsHearingResponse): VHBooking {
    const judiciaryParticipants: JudicialMemberDto[] = [];
    if (response.judge_name) {
        const judge = new JudicialMemberDto(null, null, null, null, null, null, null, response.judge_name);
        judge.roleCode = 'Judge';
        judiciaryParticipants.push(judge);
    }

    return new VHBooking({
        hearingId: response.hearing_id,
        scheduledDateTime: response.scheduled_date_time,
        scheduledDuration: response.scheduled_duration,
        case: new CaseModel(response.hearing_name, response.hearing_number),
        judiciaryParticipants: judiciaryParticipants,
        createdBy: response.created_by,
        caseType: mapCaseTypeResponseToCaseTypeModel(response.case_type),
        courtRoom: response.court_room,
        courtName: response.court_address,
        createdDate: response.created_date,
        updatedBy: response.last_edit_by,
        updatedDate: response.last_edit_date,
        status: response.status,
        audioRecordingRequired: response.audio_recording_required,
        supplier: response.conference_supplier,
        groupId: response.group_id,
        courtRoomAccount: response.court_room_account,
        allocatedTo: response.allocated_to,
        confirmedBy: response.confirmed_by,
        confirmedDate: response.confirmed_date
    });
}

export function mapCaseResponseToCaseModel(casesResponse: CaseResponse[]): CaseModel[] {
    const cases: CaseModel[] = [];
    let caseRequest: CaseModel;
    if (casesResponse && casesResponse.length > 0) {
        casesResponse.forEach(c => {
            caseRequest = new CaseModel();
            caseRequest.name = c.name;
            caseRequest.number = c.number;
            caseRequest.isLeadCase = c.is_lead_case;
            cases.push(caseRequest);
        });
    }
    return cases;
}

export function mapCaseTypeResponseToCaseTypeModel(response: CaseTypeResponse): CaseTypeModel {
    return new CaseTypeModel({
        name: response.name,
        serviceId: response.service_id,
        isAudioRecordingAllowed: response.is_audio_recording_allowed
    });
}

export function mapParticipantResponseToVHParticipant(response: ParticipantResponse): VHParticipant {
    return new VHParticipant({
        id: response.id,
        externalReferenceId: response.external_reference_id,
        title: response.title ?? '',
        firstName: response.first_name,
        lastName: response.last_name,
        middleNames: response.middle_names,
        displayName: response.display_name,
        username: response.username,
        email: response.contact_email,
        hearingRoleName: response.hearing_role_name,
        hearingRoleCode: response.hearing_role_code,
        phone: response.telephone_number,
        representee: response.representee,
        company: response.organisation,
        linkedParticipants: mapLinkedParticipantResponseToLinkedParticipantModel(response.linked_participants),
        userRoleName: response.user_role_name,
        contactEmail: response.contact_email, // Do we still need this as it duplicates email
        interpretation_language: InterpreterSelectedDto.fromAvailableLanguageResponse(response.interpreter_language),
        screening: mapScreeningResponseToScreeningDto(response.screening_requirement)
    });
}

export function mapLinkedParticipantResponseToLinkedParticipantModel(response: LinkedParticipantResponse[]): LinkedParticipantModel[] {
    const linkedParticipants: LinkedParticipantModel[] = [];
    let linkedParticipant: LinkedParticipantModel;
    if (response && response.length > 0) {
        response.forEach(p => {
            linkedParticipant = new LinkedParticipantModel();
            linkedParticipant.linkType = p.type;
            linkedParticipant.linkedParticipantId = p.linked_id;
            linkedParticipants.push(linkedParticipant);
        });
    }
    return linkedParticipants;
}

export function mapEndpointResponseToEndpointModel(response: EndpointResponse[], participants: ParticipantResponse[]): EndpointModel[] {
    const endpoints: EndpointModel[] = [];
    let endpoint: EndpointModel;
    if (response && response.length > 0) {
        response.forEach(e => {
            const endpointParticipants = participants.filter(p => e.linked_participant_ids.find(id => id === p.id));

            endpoint = new EndpointModel(e.external_reference_id);
            endpoint.id = e.id;
            endpoint.displayName = e.display_name;
            endpoint.pin = e.pin;
            endpoint.sip = e.sip;
            endpoint.participantsLinked = endpointParticipants.map(p => p.contact_email);
            endpoint.interpretationLanguage = InterpreterSelectedDto.fromAvailableLanguageResponse(e.interpreter_language);
            endpoint.screening = mapScreeningResponseToScreeningDto(e.screening_requirement);
            endpoints.push(endpoint);
        });
    }
    return endpoints;
}

export function mapPersonResponseToVHParticipant(person: PersonResponseV2): VHParticipant {
    return person
        ? new VHParticipant({
              id: person.id,
              title: person.title ?? '',
              firstName: person.first_name,
              middleNames: person.middle_names,
              lastName: person.last_name,
              email: person.contact_email ?? person.username,
              phone: person.telephone_number,
              representee: '',
              company: person.organisation,
              isJudiciaryMember: false,
              interpretation_language: null
          })
        : null;
}

export function mapJudgeResponseToVHParticipant(judge: JudgeResponse): VHParticipant {
    return judge
        ? new VHParticipant({
              firstName: judge.first_name,
              lastName: judge.last_name,
              displayName: judge.display_name,
              email: judge.contact_email ?? judge.email,
              username: judge.email,
              isCourtroomAccount: judge.account_type === JudgeAccountType.Courtroom,
              isJudiciaryMember: false,
              interpretation_language: null
          })
        : null;
}

export function mapJudicialMemberDtoToVHParticipant(judicialMember: JudicialMemberDto, isJudge = false) {
    const hearingRoleName = isJudge ? 'Judge' : 'Panel Member';
    const userRoleName = isJudge ? 'Judge' : 'PanelMember';
    const hearingRoleCode = isJudge ? 'Judge' : 'PanelMember';
    return new VHParticipant({
        firstName: judicialMember.firstName,
        lastName: judicialMember.lastName,
        hearingRoleName: hearingRoleName,
        username: judicialMember.email,
        email: judicialMember.email,
        isExistPerson: true,
        userRoleName: userRoleName,
        isJudiciaryMember: true,
        hearingRoleCode: hearingRoleCode,
        phone: judicialMember.telephone,
        displayName: judicialMember.displayName,
        interpretation_language: judicialMember.interpretationLanguage
    });
}
