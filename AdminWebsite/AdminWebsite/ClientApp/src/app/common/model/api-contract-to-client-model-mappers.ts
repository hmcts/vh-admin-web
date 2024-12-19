import {
    CaseResponse,
    HearingDetailsResponse,
    ParticipantResponse,
    LinkedParticipantResponse,
    EndpointResponse,
    BookingsHearingResponse,
    PersonResponseV2,
    JudgeAccountType,
    JudgeResponse
} from 'src/app/services/clients/api-client';
import { Constants } from 'src/app/common/constants';
import { VHBooking } from './vh-booking';
import { CaseModel } from './case.model';
import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { mapScreeningResponseToScreeningDto } from 'src/app/booking/screening/screening.model';
import { LinkedParticipantModel } from './linked-participant.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { EndpointModel } from './endpoint.model';
import { VHParticipant } from './vh-participant';

export function mapHearingToVHBooking(hearing: HearingDetailsResponse): VHBooking {
    return new VHBooking({
        hearing_id: hearing.id,
        scheduled_date_time: new Date(hearing.scheduled_date_time),
        scheduled_duration: hearing.scheduled_duration,
        case: mapCaseResponseToCaseModel(hearing.cases)[0],
        participants: hearing.participants?.map(participant => mapParticipantResponseToVHParticipant(participant)),
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
        groupId: hearing.group_id,
        allocatedTo: hearing.allocated_to_username,
        confirmedBy: hearing.confirmed_by,
        confirmedDate: hearing.confirmed_date
    });
}

export function mapBookingsHearingResponseToVHBooking(response: BookingsHearingResponse): VHBooking {
    return new VHBooking({
        hearing_id: response.hearing_id,
        scheduled_date_time: response.scheduled_date_time,
        scheduled_duration: response.scheduled_duration,
        case: new CaseModel(response.hearing_name, response.hearing_number),
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
        judge: new JudicialMemberDto(null, null, null, null, null, null, false, response.judge_name),
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



export function mapParticipantResponseToVHParticipant(response: ParticipantResponse): VHParticipant {
    return new VHParticipant({
        id: response.id,
        externalReferenceId: response.external_reference_id,
        title: response.title ?? '',
        first_name: response.first_name,
        last_name: response.last_name,
        middle_names: response.middle_names,
        display_name: response.display_name,
        username: response.username,
        email: response.contact_email,
        hearing_role_name: response.hearing_role_name,
        hearing_role_code: response.hearing_role_code,
        phone: response.telephone_number,
        representee: response.representee,
        company: response.organisation,
        //isExistPerson: false,
        linked_participants: mapLinkedParticipantResponseToLinkedParticipantModel(response.linked_participants),
        user_role_name: response.user_role_name,
        //isCourtroomAccount: false,
        //addedDuringHearing: false,
        //isStaffMember: false,
        contact_email: response.contact_email, // Do we still need this as it duplicates email
        //isJudiciaryMember: false,
        interpretation_language: InterpreterSelectedDto.fromAvailableLanguageResponse(response.interpreter_language),
        screening: mapScreeningResponseToScreeningDto(response.screening_requirement)
        //flag: false,
        //indexInList: 0
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

function getJudge(hearing: HearingDetailsResponse): JudicialMemberDto {
    const judge = hearing.judiciary_participants?.find(x => x.role_code === Constants.Judge);
    if (judge) {
        return JudicialMemberDto.fromJudiciaryParticipantResponse(judge);
    }
    return null;
}

export function mapPersonResponseToVHParticipant(person: PersonResponseV2): VHParticipant {
    return person
        ? new VHParticipant({
              id: person.id,
              title: person.title ?? '',
              first_name: person.first_name,
              middle_names: person.middle_names,
              last_name: person.last_name,
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
              first_name: judge.first_name,
              last_name: judge.last_name,
              display_name: judge.display_name,
              email: judge.contact_email ?? judge.email,
              username: judge.email,
              is_courtroom_account: judge.account_type === JudgeAccountType.Courtroom,
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
        first_name: judicialMember.firstName,
        last_name: judicialMember.lastName,
        hearing_role_name: hearingRoleName,
        username: judicialMember.email,
        email: judicialMember.email,
        is_exist_person: true,
        user_role_name: userRoleName,
        isJudiciaryMember: true,
        hearing_role_code: hearingRoleCode,
        phone: judicialMember.telephone,
        display_name: judicialMember.displayName,
        interpretation_language: judicialMember.interpretationLanguage
    });
}
