import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './security/login.component';
import { LogoutComponent } from './security/logout.component';
import { UnauthorisedComponent } from './error/unauthorised.component';
import { ErrorComponent } from './error/error.component';
import { AdminGuard } from './security/admin.guard';
import { UnsupportedBrowserComponent } from './shared/unsupported-browser/unsupported-browser.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { GetAudioFileComponent } from './get-audio-file/get-audio-file.component';
import { DeleteParticipantSearchComponent } from './delete-participant/delete-participant-search/delete-participant-search.component';
import { EditParticipantSearchComponent } from './edit-participant/edit-participant-search/edit-participant-search.component';
import { EditParticipantComponent } from './edit-participant/edit-participant/edit-participant.component';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AdminGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'logout', component: LogoutComponent },
    { path: 'unauthorised', component: UnauthorisedComponent },
    { path: 'error', component: ErrorComponent },
    { path: 'unsupported-browser', component: UnsupportedBrowserComponent },
    { path: 'change-password', component: ChangePasswordComponent, canActivate: [AdminGuard] },
    { path: 'get-audio-file', component: GetAudioFileComponent, canActivate: [AdminGuard] },
    { path: 'delete-participant', component: DeleteParticipantSearchComponent, canActivate: [AdminGuard] },
    { path: 'edit-participant-search', component: EditParticipantSearchComponent, canActivate: [AdminGuard] },
    { path: 'edit-participant', component: EditParticipantComponent, canActivate: [AdminGuard] },
    { path: '**', redirectTo: 'dashboard', pathMatch: 'full', canActivate: [AdminGuard] }
];

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forRoot(routes)]
})
export class AppRoutingModule {}
