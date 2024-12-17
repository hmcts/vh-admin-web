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
    const booking = new VHBooking();
    booking.hearing_id = hearing.id,
    booking.scheduled_date_time = new Date(hearing.scheduled_date_time),
    booking.scheduled_duration = hearing.scheduled_duration,
    booking.case = mapCaseResponseToCaseModel(hearing.cases)[0],
    booking.participants = mapParticipantResponseToParticipantModel(hearing.participants),
    booking.judiciaryParticipants = hearing.judiciary_participants?.map(judiciaryParticipant =>
        JudicialMemberDto.fromJudiciaryParticipantResponse(judiciaryParticipant)
    ),
    booking.created_by = hearing.created_by,
    booking.case_type = hearing.case_type_name,
    booking.case_type_service_id = hearing.service_id,
    booking.other_information = hearing.other_information,
    booking.court_room = hearing.hearing_room_name,
    booking.court_name = hearing.hearing_venue_name,
    booking.court_code = hearing.hearing_venue_code,
    booking.created_date = new Date(hearing.created_date),
    booking.updated_by = hearing.updated_by,
    booking.updated_date = new Date(hearing.updated_date),
    booking.status = hearing.status,
    booking.audio_recording_required = hearing.audio_recording_required,
    booking.endpoints = mapEndpointResponseToEndpointModel(hearing.endpoints, hearing.participants),
    booking.multiDayHearingLastDayScheduledDateTime = hearing.multi_day_hearing_last_day_scheduled_date_time,
    booking.hearingsInGroup = hearing.hearings_in_group?.map(hearingInGroup => mapHearingToVHBooking(hearingInGroup)),
    booking.originalScheduledDateTime = hearing.scheduled_date_time,
    booking.supplier = hearing.conference_supplier,
    booking.groupId = hearing.group_id;
    return booking;
}

export function mapBookingsHearingResponseToVHBooking(response: BookingsHearingResponse): VHBooking {
    const booking = new VHBooking();
    booking.hearing_id = response.hearing_id;
    booking.scheduled_date_time = response.scheduled_date_time;
    booking.scheduled_duration = response.scheduled_duration;

    const caseModel = new CaseModel();
    caseModel.name = response.hearing_name;
    caseModel.number = response.hearing_number;
    booking.case = caseModel;

    booking.created_by = response.created_by;
    booking.case_type = response.case_type_name;
    booking.court_room = response.court_room;
    booking.court_name = response.court_address;
    booking.created_date = response.created_date;
    booking.updated_by = response.last_edit_by;
    booking.updated_date = response.last_edit_date;
    booking.status = response.status;
    booking.audio_recording_required = response.audio_recording_required;
    booking.supplier = response.conference_supplier;
    
    if (response.judge_name) {
        booking.assignJudge(response.judge_name);
    }

    booking.groupId = response.group_id;
    booking.courtRoomAccount = response.court_room_account;
    booking.allocatedTo = response.allocated_to;
    return booking;
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