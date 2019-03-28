import { Injectable } from '@angular/core';
import { BookingsDetailsModel } from '../common/model/bookings-list.model';
import { ParticipantDetailsModel } from '../common/model/participant-details.model';
import { HearingDetailsResponse } from './clients/api-client';

@Injectable({ providedIn: 'root' })
export class BookingDetailsService {

  booking: BookingsDetailsModel;
  participants: Array<ParticipantDetailsModel> = [];
  JUDGE = 'Judge';

  mapBooking(hearingResponse: HearingDetailsResponse): BookingsDetailsModel {
    console.log(hearingResponse.status);
    return new BookingsDetailsModel(
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
      hearingResponse.status
    );
  }

  mapBookingParticipants(hearingResponse: HearingDetailsResponse) {
    const participants: Array<ParticipantDetailsModel> = [];
    const judges: Array<ParticipantDetailsModel> = [];
    if (hearingResponse.participants && hearingResponse.participants.length > 0) {
      hearingResponse.participants.forEach(p => {
        const model = new ParticipantDetailsModel(p.id, p.title, p.first_name, p.last_name,
          p.user_role_name, p.username, p.contact_email, p.case_role_name, p.hearing_role_name,
          p.display_name, p.middle_names);
        if (p.user_role_name === this.JUDGE) {
          judges.push(model);
        } else {
          participants.push(model);
        }
      });
    }

    return { judges: judges, participants: participants };
  }
}
