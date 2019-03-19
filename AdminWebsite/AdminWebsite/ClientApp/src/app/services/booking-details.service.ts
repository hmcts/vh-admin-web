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
    return new BookingsDetailsModel(
      hearingResponse.id,
      hearingResponse.scheduled_date_time,
      hearingResponse.scheduled_duration,
      hearingResponse.cases && hearingResponse.cases.length > 0 ? hearingResponse.cases[0].number : '',
      hearingResponse.cases && hearingResponse.cases.length > 0 ? hearingResponse.cases[0].name : '',
      hearingResponse.hearing_type_name,
      '',
      '', // TODO not implemented yet
      hearingResponse.hearing_venue_name,
      'stub.response@hearings.reform.hmcts.net',
      new Date(Date.now()),
      'stub.response@hearings.reform.hmcts.net',
      new Date(Date.now()),
    );
  }

  mapBookingParticipants(hearingResponse: HearingDetailsResponse) {
    const participants: Array<ParticipantDetailsModel> = [];
    const judges: Array<ParticipantDetailsModel> = [];
    if (hearingResponse.participants && hearingResponse.participants.length > 0) {
      hearingResponse.participants.forEach(p => {
        const model = new ParticipantDetailsModel(p.id, p.title, p.first_name, p.last_name,
          p.hearing_role_name, p.username, p.contact_email);
        if (p.hearing_role_name === this.JUDGE) {
          judges.push(model);
        } else {
          participants.push(model);
        }
      });
    }

    return { judges: judges, participants: participants };
  }
}
