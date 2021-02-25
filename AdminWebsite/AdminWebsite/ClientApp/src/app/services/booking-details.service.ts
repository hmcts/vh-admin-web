import { Injectable } from '@angular/core';
import { BookingsDetailsModel } from '../common/model/bookings-list.model';
import { EndpointModel } from '../common/model/endpoint.model';
import { HearingRoles } from '../common/model/hearing-roles.model';
import { ParticipantDetailsModel } from '../common/model/participant-details.model';
import { HearingDetailsResponse, ParticipantResponse } from './clients/api-client';

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
            hearingResponse.questionnaire_not_required,
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
                    p.display_name,
                    p.middle_names,
                    p.organisation,
                    p.representee,
                    p.telephone_number
                );
                model.Interpretee = this.getInterpretee(hearingResponse, p);
                if (p.user_role_name === this.JUDGE) {
                    judges.push(model);
                } else {
                    participants.push(model);
                }
            });
        }

        return { judges: judges, participants: participants };
    }

    mapBookingEndpoints(hearingResponse: HearingDetailsResponse): EndpointModel[] {
        const endpoints: EndpointModel[] = [];
        if (hearingResponse.endpoints && hearingResponse.endpoints.length > 0) {
            hearingResponse.endpoints.forEach(e => {
                const epModel = new EndpointModel();
                epModel.id = e.id;
                epModel.displayName = e.display_name;
                epModel.pin = e.pin;
                epModel.sip = e.sip;
                epModel.defenceAdvocate = e.defence_advocate_id;
                endpoints.push(epModel);
            });
        }
        return endpoints;
    }

    private getInterpretee(hearingResponse: HearingDetailsResponse, participant: ParticipantResponse): string {
        let interpreteeDisplayName = '';
        if (
            participant.hearing_role_name.toLowerCase().trim() === HearingRoles.INTERPRETER &&
            participant.linked_participants &&
            participant.linked_participants.length > 0
        ) {
            const interpreteeId = participant.linked_participants[0].linked_id;
            const interpretee = hearingResponse.participants.find(p => p.id === interpreteeId);
            interpreteeDisplayName = interpretee?.display_name;
        }
        return interpreteeDisplayName;
    }
}
