import { DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule, ErrorHandler } from '@angular/core';
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
import { ConfigService, ENVIRONMENT_CONFIG } from './services/config.service';
import { UserIdentityService } from './services/user-identity.service';
import { UnauthorisedComponent } from './error/unauthorised.component';
import { PopupModule } from './popups/popup.module';
import { SharedModule } from './shared/shared.module';
import { ErrorComponent } from './error/error.component';
import { ErrorService } from './services/error.service';
import { LoggerService } from './services/logger.service';
import { PageTrackerService } from './services/page-tracker.service';
import { AppInsightsLogger } from './services/app-insights-logger.service';
import { Config } from '../app/common/model/config';
import { WindowRef } from './security/window-ref';
import { MomentModule } from 'angular2-moment';

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
    ErrorComponent,
  ],
  imports: [
    MomentModule,
    BookingModule,
    BookingsListModule,
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    PopupModule,
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
    { provide: ErrorHandler, useClass: ErrorService },
    LoggerService,
    ErrorService,
    PageTrackerService,
    AppInsightsLogger,
    WindowRef,
    { provide: Config, useFactory: () => ENVIRONMENT_CONFIG },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

