import { NgModule, Type } from '@angular/core';
import { PopupModule } from '../popups/popup.module';
import { SharedModule } from '../shared/shared.module';
import { AddParticipantComponent } from './add-participant/add-participant.component';
import { AddStaffMemberComponent } from './add-staff-member/add-staff-member.component';
import { AssignJudgeComponent } from './assign-judge/assign-judge.component';
import { BookingConfirmationComponent } from './booking-confirmation/booking-confirmation.component';
import { BookingRoutingModule } from './booking-routing.module';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { CreateHearingComponent } from './create-hearing/create-hearing.component';
import { HearingScheduleComponent } from './hearing-schedule/hearing-schedule.component';
import { OtherInformationComponent } from './other-information/other-information.component';
import { SearchEmailComponent } from './search-email/search-email.component';
import { SummaryComponent } from './summary/summary.component';
import { RemovePopupComponent } from '../popups/remove-popup/remove-popup.component';
import { EndpointsComponent } from './endpoints/endpoints.component';
import { ParticipantItemComponent, ParticipantListComponent } from './participant';
import { MultiDayHearingScheduleComponent } from './summary/multi-day-hearing-schedule';
import { DateErrorMessagesComponent } from './hearing-schedule/date-error-messages/date-error-messages';
import { AddJudicialOfficeHoldersComponent } from './judicial-office-holders/add-judicial-office-holders/add-judicial-office-holders.component';
import { AddJudicialPanelMemberFormComponent } from './judicial-office-holders/add-judicial-panel-member-form/add-judicial-panel-member-form.component';
import { AddJudicialPresidingJudgeFormComponent } from './judicial-office-holders/add-judicial-presiding-judge-form/add-judicial-presiding-judge-form.component';

export const Components: Type<any>[] = [
    CreateHearingComponent,
    DateErrorMessagesComponent,
    HearingScheduleComponent,
    AddJudicialOfficeHoldersComponent,
    AddJudicialPresidingJudgeFormComponent,
    AddJudicialPanelMemberFormComponent,
    AssignJudgeComponent,
    AddParticipantComponent,
    AddStaffMemberComponent,
    RemovePopupComponent,
    OtherInformationComponent,
    SummaryComponent,
    BookingConfirmationComponent,
    BreadcrumbComponent,
    SearchEmailComponent,
    ParticipantListComponent,
    ParticipantItemComponent,
    EndpointsComponent,
    MultiDayHearingScheduleComponent
];

@NgModule({
    imports: [SharedModule, BookingRoutingModule, PopupModule],
    declarations: Components,
    exports: Components
})
export class BookingModule {}
