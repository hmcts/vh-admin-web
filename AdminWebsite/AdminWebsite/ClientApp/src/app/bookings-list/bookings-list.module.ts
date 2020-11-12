import { MomentModule } from 'ngx-moment';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { BookingsListRoutingModule } from './bookings-list-routing.module';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { ParticipantDetailsComponent } from './participant-details/participant-details.component';
import { BookingParticipantListComponent } from './booking-participant-list/booking-participant-list.component';
import { HearingDetailsComponent } from './hearing-details/hearing-details.component';
import { PopupModule } from '../popups/popup.module';
import { CopySipComponent } from './copy-sip/copy-sip.component';

@NgModule({
    imports: [SharedModule, BookingsListRoutingModule, PopupModule, MomentModule],
    declarations: [
        BookingsListComponent,
        BookingDetailsComponent,
        ParticipantDetailsComponent,
        BookingParticipantListComponent,
        HearingDetailsComponent,
        CopySipComponent
    ],
    exports: [
        BookingsListComponent,
        BookingDetailsComponent,
        ParticipantDetailsComponent,
        BookingParticipantListComponent,
        HearingDetailsComponent
    ]
})
export class BookingsListModule {}
