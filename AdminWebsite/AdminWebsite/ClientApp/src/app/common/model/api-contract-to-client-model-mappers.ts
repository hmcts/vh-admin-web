import {
    CaseResponse,
    HearingDetailsResponse,
    ParticipantResponse,
    LinkedParticipantResponse,
    EndpointResponse,
    BookingsHearingResponse
} from 'src/app/services/clients/api-client';
import { Constants } from 'src/app/common/constants';
import { VHBooking } from './vh-booking';
import { CaseModel } from './case.model';
import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { mapScreeningResponseToScreeningDto } from 'src/app/booking/screening/screening.model';
import { ParticipantModel } from './participant.model';
import { LinkedParticipantModel } from './linked-participant.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { EndpointModel } from './endpoint.model';

export function mapHearingToVHBooking(hearing: HearingDetailsResponse): VHBooking {
    return {
        hearing_id: hearing.id,
        scheduled_date_time: new Date(hearing.scheduled_date_time),
        scheduled_duration: hearing.scheduled_duration,
        case: mapCaseResponseToCaseModel(hearing.cases)[0],
        participants: mapParticipantResponseToParticipantModel(hearing.participants),
        judiciaryParticipants: hearing.judiciary_participants?.map(judiciaryParticipant =>
            JudicialMemberDto.fromJudiciaryParticipantResponse(judiciaryParticipant)
        ),
        created_by: hearing.created_by,
        case_type: hearing.case_type_name,
        case_type_service_id: hearing.service_id,
        other_information: hearing.other_information,
        court_room: hearing.hearing_room_name,
        court_name: hearing.hearing_venue_name,
        court_code: hearing.hearing_venue_code,
        created_date: new Date(hearing.created_date),
        updated_by: hearing.updated_by,
        updated_date: new Date(hearing.updated_date),
        status: hearing.status,
        audio_recording_required: hearing.audio_recording_required,
        endpoints: mapEndpointResponseToEndpointModel(hearing.endpoints, hearing.participants),
        isMultiDay: hearing.group_id !== null && hearing.group_id !== undefined,
        multiDayHearingLastDayScheduledDateTime: hearing.multi_day_hearing_last_day_scheduled_date_time,
        hearingsInGroup: hearing.hearings_in_group?.map(hearingInGroup => mapHearingToVHBooking(hearingInGroup)),
        originalScheduledDateTime: hearing.scheduled_date_time,
        supplier: hearing.conference_supplier,
        judge: getJudge(hearing),
        isLastDayOfMultiDayHearing:
            hearing.scheduled_date_time.getTime() === hearing.multi_day_hearing_last_day_scheduled_date_time?.getTime(),
        groupId: hearing.group_id
    };
}

export function mapBookingsHearingResponseToVHBooking(response: BookingsHearingResponse): VHBooking {
    return {
        hearing_id: response.hearing_id,
        scheduled_date_time: response.scheduled_date_time,
        scheduled_duration: response.scheduled_duration,
        case: mapCaseNameAndNumberToCaseModel(response.hearing_name, response.hearing_number),
        created_by: response.created_by,
        case_type: response.case_type_name,
        court_room: response.court_room,
        court_name: response.court_address,
        created_date: response.created_date,
        updated_by: response.last_edit_by,
        updated_date: response.last_edit_date,
        status: response.status,
        audio_recording_required: response.audio_recording_required,
        supplier: response.conference_supplier,
        judge: mapJudgeNameToJudge(response.judge_name),
        groupId: response.group_id,
        courtRoomAccount: response.court_room_account,
        allocatedTo: response.allocated_to
    };
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

export function mapCaseNameAndNumberToCaseModel(name: string, number: string): CaseModel {
    const model = new CaseModel();
    model.name = name;
    model.number = number;
    return model;
}

export function mapParticipantResponseToParticipantModel(response: ParticipantResponse[]): ParticipantModel[] {
    const participants: ParticipantModel[] = [];
    let participant: ParticipantModel;
    if (response && response.length > 0) {
        response.forEach(p => {
            participant = new ParticipantModel();
            participant.id = p.id;
            participant.title = p.title;
            participant.first_name = p.first_name;
            participant.middle_names = p.middle_names;
            participant.last_name = p.last_name;
            participant.username = p.username;
            participant.display_name = p.display_name;
            participant.email = p.contact_email;
            participant.phone = p.telephone_number;
            participant.hearing_role_name = p.hearing_role_name;
            participant.hearing_role_code = p.hearing_role_code;
            participant.representee = p.representee;
            participant.company = p.organisation;
            participant.is_judge = p.user_role_name === Constants.UserRoles.Judge;
            participant.is_staff_member = p.user_role_name === Constants.UserRoles.StaffMember;
            participant.linked_participants = mapLinkedParticipantResponseToLinkedParticipantModel(p.linked_participants);
            participant.user_role_name = p.user_role_name;
            participant.interpretation_language = InterpreterSelectedDto.fromAvailableLanguageResponse(p.interpreter_language);
            participant.screening = mapScreeningResponseToScreeningDto(p.screening_requirement);
            if (p.external_reference_id) {
                // only override the external reference id if it is not null else ParticipantModel will initialise to a UUID in the ctor
                participant.externalReferenceId = p.external_reference_id;
            }
            participants.push(participant);
        });
    }
    return participants;
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
            const defenceAdvocate = participants.find(p => p.id === e.defence_advocate_id);
            endpoint = new EndpointModel(e.external_reference_id);
            endpoint.id = e.id;
            endpoint.displayName = e.display_name;
            endpoint.pin = e.pin;
            endpoint.sip = e.sip;
            endpoint.defenceAdvocate = defenceAdvocate?.contact_email;
            endpoint.interpretationLanguage = InterpreterSelectedDto.fromAvailableLanguageResponse(e.interpreter_language);
            endpoint.screening = mapScreeningResponseToScreeningDto(e.screening_requirement);
            endpoints.push(endpoint);
        });
    }
    return endpoints;
}

export function mapJudgeNameToJudge(judgeName: string): JudicialMemberDto {
    const judge = new JudicialMemberDto(null, null, null, null, null, null, false);
    judge.displayName = judgeName;
    return judge;
}

function getJudge(hearing: HearingDetailsResponse): JudicialMemberDto {
    const judge = hearing.judiciary_participants?.find(x => x.role_code === Constants.Judge);
    if (judge) {
        return JudicialMemberDto.fromJudiciaryParticipantResponse(judge);
    }
    return null;
}
