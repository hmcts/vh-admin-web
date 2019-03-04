import { NgModule } from '@angular/core';

import { PopupModule } from '../popups/popup.module';
import { SharedModule } from '../shared/shared.module';
import { AddParticipantComponent } from './add-participant/add-participant.component';
import { AssignJudgeComponent } from './assign-judge/assign-judge.component';
import { BookingConfirmationComponent } from './booking-confirmation/booking-confirmation.component';
import { BookingRoutingModule } from './booking-routing.module';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { CreateHearingComponent } from './create-hearing/create-hearing.component';
import { HearingScheduleComponent } from './hearing-schedule/hearing-schedule.component';
import { OtherInformationComponent } from './other-information/other-information.component';
import { ParticipantsListComponent } from './participants-list/participants-list.component';
import { SearchEmailComponent } from './search-email/search-email.component';
import { SummaryComponent } from './summary/summary.component';
import { RemovePopupComponent } from '../popups/remove-popup/remove-popup.component';

@NgModule({
  imports: [
    SharedModule,
    BookingRoutingModule,
    PopupModule
  ],
  declarations: [
    CreateHearingComponent,
    HearingScheduleComponent,
    AssignJudgeComponent,
    AddParticipantComponent,
    RemovePopupComponent,
    OtherInformationComponent,
    SummaryComponent,
    BookingConfirmationComponent,
    BreadcrumbComponent,
    SearchEmailComponent,
    ParticipantsListComponent,
  ],
  exports: [
    CreateHearingComponent,
    HearingScheduleComponent,
    AssignJudgeComponent,
    AddParticipantComponent,
    OtherInformationComponent,
    SummaryComponent,
    BookingConfirmationComponent,
    BreadcrumbComponent,
    SearchEmailComponent,
    ParticipantsListComponent
  ]
})
export class BookingModule { }
