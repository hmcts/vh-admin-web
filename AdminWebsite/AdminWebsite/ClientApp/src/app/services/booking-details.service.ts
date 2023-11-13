import { Injectable } from '@angular/core';
import { BookingsDetailsModel } from '../common/model/bookings-list.model';
import { EndpointModel } from '../common/model/endpoint.model';
import { HearingRoleCodes, HearingRoles } from '../common/model/hearing-roles.model';
import { ParticipantDetailsModel } from '../common/model/participant-details.model';
import { JudiciaryParticipantDetailsModel } from '../common/model/judiciary-participant-details.model';
import { HearingDetailsResponse, ParticipantResponse } from './clients/api-client';
import { JudicaryRoleCode } from '../booking/judicial-office-holders/models/add-judicial-member.model';

@Injectable({ providedIn: 'root' })
export class BookingDetailsService {
    booking: BookingsDetailsModel;
    participants: Array<ParticipantDetailsModel> = [];
    JUDGE = 'Judge';

    mapBooking(hearingResponse: HearingDetailsResponse): BookingsDetailsModel {
        const model = new BookingsDetailsModel(
            hearingResponse.id,
            hearingResponse.scheduled_date_time,
            hearingResponse.scheduled_duration,
            hearingResponse.cases && hearingResponse.cases.length > 0 ? hearingResponse.cases[0].number : '',
            hearingResponse.cases && hearingResponse.cases.length > 0 ? hearingResponse.cases[0].name : '',
            hearingResponse.hearing_type_name,
            '',
            hearingResponse.hearing_room_name,
            hearingResponse.hearing_venue_name,
            hearingResponse.created_by,
            hearingResponse.created_date,
            hearingResponse.updated_by,
            hearingResponse.updated_date,
            hearingResponse.confirmed_by,
            hearingResponse.confirmed_date,
            hearingResponse.status,
            hearingResponse.audio_recording_required,
            hearingResponse.cancel_reason,
            hearingResponse.case_type_name,
            '',
            ''
        );

        model.OtherInformation = hearingResponse.other_information;
        return model;
    }

    mapBookingParticipants(hearingResponse: HearingDetailsResponse) {
        const participants: Array<ParticipantDetailsModel> = [];
        const judges: Array<ParticipantDetailsModel> = [];
        const judicialMembers: Array<JudiciaryParticipantDetailsModel> = [];

        const mappedJohs = hearingResponse.judiciary_participants.map(
            j =>
                new JudiciaryParticipantDetailsModel(
                    j.title,
                    j.first_name,
                    j.last_name,
                    j.full_name,
                    j.email,
                    j.work_phone,
                    j.personal_code,
                    j.role_code.toString() as JudicaryRoleCode,
                    j.display_name
                )
        );
        judicialMembers.push(...mappedJohs);

        if (hearingResponse.participants && hearingResponse.participants.length > 0) {
            hearingResponse.participants.forEach(p => {
                const model = new ParticipantDetailsModel(
                    p.id,
                    p.title,
                    p.first_name,
                    p.last_name,
                    p.user_role_name,
                    p.username,
                    p.contact_email,
                    p.case_role_name,
                    p.hearing_role_name,
                    p.hearing_role_code,
                    p.display_name,
                    p.middle_names,
                    p.organisation,
                    p.representee,
                    p.telephone_number,
                    this.getInterpretee(hearingResponse, p),
                    this.isInterpretee(p),
                    p.linked_participants
                );
                if (p.user_role_name === this.JUDGE) {
                    judges.push(model);
                } else {
                    participants.push(model);
                }
            });
        }

        return { judges: judges, participants: participants, judicialMembers: judicialMembers };
    }

    mapBookingEndpoints(hearingResponse: HearingDetailsResponse): EndpointModel[] {
        const endpoints: EndpointModel[] = [];
        if (hearingResponse.endpoints && hearingResponse.endpoints.length > 0) {
            hearingResponse.endpoints.forEach(e => {
                const defenceAdvocate = hearingResponse.participants.find(p => p.id === e.defence_advocate_id);
                const epModel = new EndpointModel();
                epModel.id = e.id;
                epModel.displayName = e.display_name;
                epModel.pin = e.pin;
                epModel.sip = e.sip;
                epModel.defenceAdvocate = defenceAdvocate?.contact_email;
                endpoints.push(epModel);
            });
        }
        return endpoints;
    }

    private getInterpretee(hearingResponse: HearingDetailsResponse, participant: ParticipantResponse): string {
        let interpreteeDisplayName = '';
        const isInterpreter =
            participant.hearing_role_name?.toLowerCase()?.trim() === HearingRoles.INTERPRETER ||
            participant.hearing_role_code === HearingRoleCodes.Interpreter;
        if (isInterpreter && participant.linked_participants && participant.linked_participants.length > 0) {
            const interpreteeId = participant.linked_participants[0].linked_id;
            const interpretee = hearingResponse.participants.find(p => p.id === interpreteeId);
            interpreteeDisplayName = interpretee?.display_name;
        }
        return interpreteeDisplayName;
    }

    private isInterpretee(participant: ParticipantResponse): boolean {
        const isInterpreter =
            participant.hearing_role_name?.toLowerCase()?.trim() === HearingRoles.INTERPRETER ||
            participant.hearing_role_code === HearingRoleCodes.Interpreter;
        return !isInterpreter && participant.linked_participants && participant.linked_participants.length > 0;
    }
}
