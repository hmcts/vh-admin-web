import { NgModule, Type } from '@angular/core';
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
import { SearchEmailComponent } from './search-email/search-email.component';
import { SummaryComponent } from './summary/summary.component';
import { RemovePopupComponent } from '../popups/remove-popup/remove-popup.component';
import { EndpointsComponent } from './endpoints/endpoints.component';
import { ParticipantItemComponent, ParticipantListComponent } from './participant';
import { MultiDayHearingScheduleComponent } from './summary/multi-day-hearing-schedule';
import { DateErrorMessagesComponent } from './hearing-schedule/date-error-messages/date-error-messages';
import { AddJudicialOfficeHoldersComponent } from './judicial-office-holders/add-judicial-office-holders/add-judicial-office-holders.component';
import { SearchForJudicialMemberComponent } from './judicial-office-holders/search-for-judicial-member/search-for-judicial-member.component';
import { NgOptimizedImage } from '@angular/common';
import { EditHearingDatesComponent } from './hearing-schedule/edit-hearing-dates/edit-hearing-dates.component';
import { VideoEndpointFormComponent } from './endpoints/video-endpoint-form/video-endpoint-form.component';
import { VideoEndpointListComponent } from './endpoints/video-endpoint-list/video-endpoint-list.component';
import { VideoEndpointItemComponent } from './endpoints/video-endpoint-item/video-endpoint-item.component';
import { InterpreterFormComponent } from './interpreter-form/interpreter-form.component';

export const Components: Type<any>[] = [
    CreateHearingComponent,
    DateErrorMessagesComponent,
    EditHearingDatesComponent,
    HearingScheduleComponent,
    AddJudicialOfficeHoldersComponent,
    SearchForJudicialMemberComponent,
    AssignJudgeComponent,
    AddParticipantComponent,
    RemovePopupComponent,
    OtherInformationComponent,
    SummaryComponent,
    BookingConfirmationComponent,
    BreadcrumbComponent,
    SearchEmailComponent,
    ParticipantListComponent,
    ParticipantItemComponent,
    EndpointsComponent,
    MultiDayHearingScheduleComponent,
    VideoEndpointFormComponent,
    VideoEndpointListComponent,
    VideoEndpointItemComponent,
    InterpreterFormComponent
];

@NgModule({
    imports: [SharedModule, BookingRoutingModule, PopupModule, NgOptimizedImage],
    declarations: Components,
    exports: Components
})
export class BookingModule {}
