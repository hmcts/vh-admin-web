import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AddParticipantComponent } from './add-participant/add-participant.component';
import { AssignJudgeComponent } from './assign-judge/assign-judge.component';
import { BookingConfirmationComponent } from './booking-confirmation/booking-confirmation.component';
import { CreateHearingComponent } from './create-hearing/create-hearing.component';
import { HearingScheduleComponent } from './hearing-schedule/hearing-schedule.component';
import { OtherInformationComponent } from './other-information/other-information.component';
import { SummaryComponent } from './summary/summary.component';
import { EndpointsComponent } from './endpoints/endpoints.component';
import { AddJudicialOfficeHoldersComponent } from './judicial-office-holders/add-judicial-office-holders/add-judicial-office-holders.component';
import { LastMinuteAmendmentsGuard } from '../security/guards/last-minute-amendments.guard';
import { AdminGuard } from '../security/guards/admin.guard';
import { AuthGuard } from '../security/guards/auth.guard';

export const routes: Routes = [
    { path: 'book-hearing', component: CreateHearingComponent, canActivate: [AuthGuard, AdminGuard, LastMinuteAmendmentsGuard] },
    { path: 'hearing-schedule', component: HearingScheduleComponent, canActivate: [AuthGuard, AdminGuard, LastMinuteAmendmentsGuard] },
    {
        path: 'assign-judge',
        component: AssignJudgeComponent,
        canActivate: [AuthGuard, AdminGuard, LastMinuteAmendmentsGuard],
        data: { exceptionToRuleCheck: true }
    },
    {
        path: 'add-judicial-office-holders',
        component: AddJudicialOfficeHoldersComponent,
        canActivate: [AuthGuard, AdminGuard, LastMinuteAmendmentsGuard],
        data: { exceptionToRuleCheck: true }
    },
    { path: 'add-participants', component: AddParticipantComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'video-access-points', component: EndpointsComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'other-information', component: OtherInformationComponent, canActivate: [AuthGuard, AdminGuard, LastMinuteAmendmentsGuard] },
    { path: 'summary', component: SummaryComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'booking-confirmation', component: BookingConfirmationComponent, canActivate: [AuthGuard, AdminGuard] }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BookingRoutingModule {}
