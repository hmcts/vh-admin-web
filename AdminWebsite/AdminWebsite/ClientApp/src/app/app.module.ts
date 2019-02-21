import { DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AdalGuard, AdalInterceptor, AdalService } from 'adal-angular4';

import { AppRoutingModule } from './/app-routing.module';
import { AppComponent } from './app.component';
import { BookingModule } from './booking/booking.module';
import { BookingsListModule } from './bookings-list/bookings-list.module';
import { CheckListComponent } from './check-list/check-list.component';
import { ChangesGuard } from './common/guards/changes.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './security/auth.gaurd';
import { AdminGuard } from './security/admin.guard';
import { VhOfficerAdminGuard } from './security/vh-officer-admin.guard';
import { LoginComponent } from './security/login.component';
import { LogoutComponent } from './security/logout.component';
import { BH_API_BASE_URL } from './services/clients/api-client';
import { ConfigService } from './services/config.service';
import { UserIdentityService } from './services/user-identity.service';
import { UnauthorisedComponent } from './error/unauthorised.component';

import { SharedModule } from './shared/shared.module';

export function getSettings(configService: ConfigService) {
  return () => configService.loadConfig();
}

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    LoginComponent,
    LogoutComponent,
    CheckListComponent,
    UnauthorisedComponent,
  ],
  imports: [
    BookingModule,
    BookingsListModule,
    BrowserModule,
    AppRoutingModule,
    SharedModule
  ],
  providers: [
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    { provide: APP_INITIALIZER, useFactory: getSettings, deps: [ConfigService], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AdalInterceptor, multi: true },
    { provide: BH_API_BASE_URL, useFactory: () => '.' },
    AdalService,
    AdalGuard,
    ConfigService,
    AuthGuard,
    ChangesGuard,
    DatePipe,
    UserIdentityService,
    AdminGuard,
    VhOfficerAdminGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

