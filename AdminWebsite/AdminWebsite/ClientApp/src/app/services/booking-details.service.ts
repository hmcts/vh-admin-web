import { Injectable } from '@angular/core';
import { BookingsDetailsModel } from '../common/model/bookings-list.model';
import { ParticipantDetailsModel } from '../common/model/participant-details.model';
import { HearingResponse } from '../services/clients/api-client';

@Injectable({ providedIn: 'root' })
export class BookingDetailsService {

  booking: BookingsDetailsModel;
  participants: Array<ParticipantDetailsModel> = [];
  JUDGE = 'Judge';

  mapBooking(hearingResponse: HearingResponse): BookingsDetailsModel {
    return new BookingsDetailsModel(
      hearingResponse.id,
      hearingResponse.scheduled_date_time,
      hearingResponse.scheduled_duration,
      hearingResponse.cases && hearingResponse.cases.length > 0 ? hearingResponse.cases[0].number : '',
      hearingResponse.cases && hearingResponse.cases.length > 0 ? hearingResponse.cases[0].name : '',
      hearingResponse.hearing_type,
      '',
      hearingResponse.court ? hearingResponse.court.room : '',
      hearingResponse.court ? hearingResponse.court.address : '',
      hearingResponse.created_by ? hearingResponse.created_by : '',
      hearingResponse.created_date,
      hearingResponse.updated_by ? hearingResponse.updated_by : '',
      hearingResponse.updated_date,
    );
  }

  mapBookingParticipants(hearingResponse: HearingResponse) {
    const participants: Array<ParticipantDetailsModel> = [];
    const judges: Array<ParticipantDetailsModel> = [];
    if (hearingResponse.participants && hearingResponse.participants.length > 0) {
      hearingResponse.participants.forEach(p => {
        const model = new ParticipantDetailsModel(p.id, p.title, p.first_name, p.last_name, p.participant_role, p.username, p.email);
        if (p.participant_role === this.JUDGE) {
          judges.push(model);
        } else {
          participants.push(model);
        }
      });
    }

    return { judges: judges, participants: participants };
  }
}
