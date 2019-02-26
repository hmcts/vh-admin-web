import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CheckListComponent } from './check-list/check-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './security/auth.gaurd';
import { LoginComponent } from './security/login.component';
import { LogoutComponent } from './security/logout.component';
import { VhOfficerAdminGuard } from './security/vh-officer-admin.guard';
import { UnauthorisedComponent } from './error/unauthorised.component';
import { ErrorComponent } from './error/error.component';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'logout', component: LogoutComponent },
    { path: 'checklists', component: CheckListComponent, canActivate: [VhOfficerAdminGuard] },
    { path: 'unauthorised', component: UnauthorisedComponent },
    { path: 'error', component: ErrorComponent },
    { path: '**', redirectTo: 'dashboard', pathMatch: 'full', canActivate: [AuthGuard] }
];

@NgModule({
    exports: [
        RouterModule
    ],
    imports: [
        RouterModule.forRoot(routes)],
})

export class AppRoutingModule { }
