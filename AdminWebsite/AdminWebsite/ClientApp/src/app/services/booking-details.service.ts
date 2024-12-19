import { Injectable } from '@angular/core';
import { HearingRoleCodes, HearingRoles } from '../common/model/hearing-roles.model';
import { HearingDetailsResponse, ParticipantResponse } from './clients/api-client';
import { createVHBookingFromDetails, VHBooking } from '../common/model/vh-booking';
import { VHParticipant } from '../common/model/vh-participant';

@Injectable({ providedIn: 'root' })
export class BookingDetailsService {
    booking: VHBooking;
    participants: Array<VHParticipant> = [];
    JUDGE = 'Judge';

    mapBooking(hearingResponse: HearingDetailsResponse): VHBooking {
        const model = createVHBookingFromDetails(
            hearingResponse.id,
            hearingResponse.scheduled_date_time,
            hearingResponse.scheduled_duration,
            hearingResponse.cases && hearingResponse.cases.length > 0 ? hearingResponse.cases[0].number : '',
            hearingResponse.cases && hearingResponse.cases.length > 0 ? hearingResponse.cases[0].name : '',
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
        model.groupId = hearingResponse.group_id;
        model.multiDayHearingLastDayScheduledDateTime = hearingResponse.multi_day_hearing_last_day_scheduled_date_time;

        model.other_information = hearingResponse.other_information;
        model.allocatedTo = hearingResponse.allocated_to_username;
        return model;
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
