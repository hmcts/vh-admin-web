import { NgModule } from '@angular/core';
import { MomentModule } from 'angular2-moment';
import { SharedModule } from '../shared/shared.module';
import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { BookingsListRoutingModule } from './bookings-list-routing.module';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { ParticipantDetailsComponent } from './participant-details/participant-details.component';
import { BookingParticipantListComponent } from './booking-participant-list/booking-participant-list.component';
import { HearingDetailsComponent } from './hearing-details/hearing-details.component';


@NgModule({
  imports: [
    SharedModule,
    BookingsListRoutingModule,
    MomentModule
  ],
  declarations: [
    BookingsListComponent,
    BookingDetailsComponent,
    ParticipantDetailsComponent,
    BookingParticipantListComponent,
    HearingDetailsComponent,
  ],
  exports: [
    BookingsListComponent,
    BookingDetailsComponent,
    ParticipantDetailsComponent,
    BookingParticipantListComponent,
    HearingDetailsComponent,
  ]
})
export class BookingsListModule { }
