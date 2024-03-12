import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LogoutComponent } from './security/logout.component';
import { UnauthorisedComponent } from './error/unauthorised.component';
import { ErrorComponent } from './error/error.component';
import { UnsupportedBrowserComponent } from './shared/unsupported-browser/unsupported-browser.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { GetAudioFileComponent } from './get-audio-file/get-audio-file.component';
import { DeleteParticipantSearchComponent } from './delete-participant/delete-participant-search/delete-participant-search.component';
import { EditParticipantSearchComponent } from './edit-participant/edit-participant-search/edit-participant-search.component';
import { EditParticipantComponent } from './edit-participant/edit-participant/edit-participant.component';
import { HomeComponent } from './home/home.component';
import { AdminGuard } from './security/guards/admin.guard';
import { WorkAllocationFeatureGuard } from './security/guards/work-allocation-feature.guard';
import { VhOfficerAdminGuard } from './security/guards/vh-officer-admin.guard';
import { LoginComponent } from './security/login.component';
import { ReformLoginComponent } from './security/reform-login.component';
import { AudioSearchGuard } from './security/audio-search.guard';
import { ManageTeamFeatureGuard } from './security/guards/manage-team-feature.guard';
import { AuthGuard } from './security/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'reform-login', component: ReformLoginComponent },
    { path: 'login-reform', component: ReformLoginComponent },
    { path: 'home', component: HomeComponent }, // does nothing but setting up auth
    { path: 'logout', component: LogoutComponent },
    { path: 'unauthorised', component: UnauthorisedComponent },
    { path: 'error', component: ErrorComponent },
    { path: 'unsupported-browser', component: UnsupportedBrowserComponent },
    { path: 'change-password', component: ChangePasswordComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'get-audio-file', component: GetAudioFileComponent, canActivate: [AuthGuard, AdminGuard, AudioSearchGuard] },
    { path: 'delete-participant', component: DeleteParticipantSearchComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'edit-participant-search', component: EditParticipantSearchComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'edit-participant', component: EditParticipantComponent, canActivate: [AuthGuard, AdminGuard] },
    {
        path: 'work-allocation',
        canActivate: [AuthGuard, VhOfficerAdminGuard, WorkAllocationFeatureGuard],
        loadChildren: () => import('./work-allocation/work-allocation.module').then(m => m.WorkAllocationModule)
    },
    {
        path: 'manage-team',
        canActivate: [AuthGuard, VhOfficerAdminGuard, ManageTeamFeatureGuard],
        loadChildren: () => import('./manage-team/manage-team.module').then(m => m.ManageTeamModule)
    },
    { path: '**', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forRoot(routes)]
})
export class AppRoutingModule {}
