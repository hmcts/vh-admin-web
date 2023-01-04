import { MomentModule } from 'ngx-moment';
import { SuitabilityModule } from './suitability/suitability.module';
import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule, ErrorHandler } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BookingModule } from './booking/booking.module';
import { BookingsListModule } from './bookings-list/bookings-list.module';
import { ChangesGuard } from './common/guards/changes.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './security/auth.guard';
import { AdminGuard } from './security/admin.guard';
import { LastMinuteAmendmentsGuard } from './security/last-minute-amendments.guard';
import { VhOfficerAdminGuard } from './security/vh-officer-admin.guard';
import { WorkAllocationFeatureGuard } from './security/work-allocation-feature.guard';
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
import { LoggerService, LOG_ADAPTER } from './services/logger.service';
import { PageTrackerService } from './services/page-tracker.service';
import { AppInsightsLogger } from './services/app-insights-logger.service';
import { Logger } from './services/logger';
import { ConsoleLogger } from './services/console-logger';
import { Config } from './common/model/config';
import { WindowRef } from './security/window-ref';
import { UnsupportedBrowserComponent } from './shared/unsupported-browser/unsupported-browser.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { GetAudioFileModule } from './get-audio-file/get-audio-file.module';
import { DeleteParticipantModule } from './delete-participant/delete-participant.module';
import { EditParticipantModule } from './edit-participant/edit-participant.module';
import { AuthConfigModule } from './security/auth-config.module';
import { WorkAllocationComponent } from './work-allocation/work-allocation.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditWorkHoursComponent } from './work-allocation/edit-work-hours/edit-work-hours.component';
import { VhoSearchComponent } from './work-allocation/edit-work-hours/vho-search/vho-search.component';
import { VhoWorkHoursTableComponent } from './work-allocation/edit-work-hours/vho-work-hours-table/vho-work-hours-table.component';
import { VhoWorkHoursNonAvailabilityTableComponent } from './work-allocation/edit-work-hours/vho-work-hours-non-availability-table/vho-work-hours-non-availability-table.component';
import { ConfirmDeleteHoursPopupComponent } from './popups/confirm-delete-popup/confirm-delete-popup.component';
import { UnallocatedHearingsComponent } from './work-allocation/unallocated-hearings/unallocated-hearings.component';

export function loadConfig(configService: ConfigService) {
    return () => configService.loadConfig();
}

@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
        LoginComponent,
        LogoutComponent,
        UnauthorisedComponent,
        ErrorComponent,
        UnsupportedBrowserComponent,
        ChangePasswordComponent,
        WorkAllocationComponent,
        EditWorkHoursComponent,
        VhoSearchComponent,
        VhoWorkHoursTableComponent,
        VhoWorkHoursNonAvailabilityTableComponent,
        ConfirmDeleteHoursPopupComponent,
        UnallocatedHearingsComponent
    ],
    imports: [
        MomentModule,
        BookingModule,
        BookingsListModule,
        BrowserModule,
        FontAwesomeModule,
        SuitabilityModule,
        AppRoutingModule,
        SharedModule,
        PopupModule,
        GetAudioFileModule,
        DeleteParticipantModule,
        EditParticipantModule,
        AuthConfigModule
    ],
    providers: [
        HttpClientModule,
        ReactiveFormsModule,
        AppRoutingModule,
        { provide: APP_INITIALIZER, useFactory: loadConfig, deps: [ConfigService], multi: true },
        { provide: Config, useFactory: () => ENVIRONMENT_CONFIG },
        { provide: BH_API_BASE_URL, useFactory: () => '.' },
        { provide: LOG_ADAPTER, useClass: ConsoleLogger, multi: true },
        { provide: LOG_ADAPTER, useClass: AppInsightsLogger, multi: true },
        { provide: Logger, useClass: LoggerService },
        ConfigService,
        AuthGuard,
        ChangesGuard,
        DatePipe,
        UserIdentityService,
        AdminGuard,
        LastMinuteAmendmentsGuard,
        VhOfficerAdminGuard,
        { provide: ErrorHandler, useClass: ErrorService },
        LoggerService,
        ErrorService,
        PageTrackerService,
        AppInsightsLogger,
        WindowRef,
        WorkAllocationFeatureGuard
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
