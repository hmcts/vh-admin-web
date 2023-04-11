import { Location } from '@angular/common';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { routes } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChangesGuard } from './common/guards/changes.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './security/auth.guard';
import { AdminGuard } from './security/admin.guard';

import { LoginComponent } from './security/login.component';
import { LogoutComponent } from './security/logout.component';
import { MockChangesGuard } from './testing/mocks/MockChangesGuard';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { HeaderStubComponent } from './testing/stubs/header-stub';
import { PaginationStubComponent } from './testing/stubs/pagination-stub';
import { UnauthorisedComponent } from './error/unauthorised.component';
import { ErrorComponent } from './error/error.component';
import { ErrorService } from './services/error.service';
import { SignOutPopupComponent } from './popups/sign-out-popup/sign-out-popup.component';
import { WaitPopupComponent } from './popups/wait-popup/wait-popup.component';
import { CancelPopupStubComponent } from './testing/stubs/cancel-popup-stub';
import { SaveFailedPopupComponent } from './popups/save-failed-popup/save-failed-popup.component';
import { CancelBookingPopupComponent } from './popups/cancel-booking-popup/cancel-booking-popup.component';
import { UnsupportedBrowserComponent } from './shared/unsupported-browser/unsupported-browser.component';
import { Logger } from './services/logger';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { UpdateUserPopupComponent } from './popups/update-user-popup/update-user-popup.component';
import { GetAudioFileComponent } from './get-audio-file/get-audio-file.component';
import { GetAudioLinkButtonComponent } from './get-audio-file/get-audio-link-button/get-audio-link-button.component';
import { HearingSearchDateTimePipe } from './shared/directives/hearing-search-date-time.pipe';
import { ConfirmBookingFailedPopupComponent } from './popups/confirm-booking-failed-popup/confirm-booking-failed-popup.component';
import { MockOidcSecurityService } from './testing/mocks/MockOidcSecurityService';
import { ConfigService } from './services/config.service';
import { ClientSettingsResponse } from './services/clients/api-client';
import { of } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { HearingSearchResultsComponent } from './get-audio-file/get-audio-file-vh/hearing-search-results/hearing-search-results.component';
import { LaunchDarklyService } from './services/launch-darkly.service';
import { UserIdentityService } from './services/user-identity.service';

describe('app routing', () => {
    let location: Location;
    let router: Router;
    let fixture: ComponentFixture<DashboardComponent>;
    const oidcSecurityService = new MockOidcSecurityService();
    const UserIdentityServiceSpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['getUserInformation']);
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/dashboard',
        redirect_uri: '/dashboard',
        launch_darkly_client_id: 'launchDarklyClientId'
    });
    const configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings', 'loadConfig', 'getConfig']);
    configServiceSpy.getClientSettings.and.returnValue(of(clientSettings));
    const launchDarklyServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['flagChange']);
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, RouterTestingModule.withRoutes(routes), FormsModule],
            declarations: [
                DashboardComponent,
                AppComponent,
                LoginComponent,
                LogoutComponent,
                HeaderStubComponent,
                FooterStubComponent,
                PaginationStubComponent,
                UnauthorisedComponent,
                ErrorComponent,
                SignOutPopupComponent,
                WaitPopupComponent,
                SaveFailedPopupComponent,
                ConfirmBookingFailedPopupComponent,
                CancelPopupStubComponent,
                CancelBookingPopupComponent,
                UnsupportedBrowserComponent,
                ChangePasswordComponent,
                UpdateUserPopupComponent,
                GetAudioFileComponent,
                GetAudioLinkButtonComponent,
                HearingSearchDateTimePipe,
                HearingSearchResultsComponent
            ],
            providers: [
                AuthGuard,
                AdminGuard,
                { provide: ChangesGuard, useClass: MockChangesGuard },
                { provide: OidcSecurityService, useValue: oidcSecurityService },
                { provide: UserIdentityService, useValue: UserIdentityServiceSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                HttpClient,
                HttpHandler,
                { provide: ConfigService, useValue: configServiceSpy },
                ErrorService,
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
    });

    it('it should navigate to login, if not authenticated', fakeAsync(() => {
        oidcSecurityService.setAuthenticated(false);
        router.navigate(['/dashboard']);
        tick();
        expect(location.path()).toBe('/login');
    }));

    it('it should navigate to unauthorised, if not correct role', fakeAsync(() => {
        oidcSecurityService.setAuthenticated(true);
        UserIdentityServiceSpy.getUserInformation.and.returnValue(
            of({
                is_vh_officer_administrator_role: false,
                is_case_administrator: false
            })
        );
        router.navigate(['/dashboard']);
        tick();
        expect(location.path()).toBe('/unauthorised');
    }));
});
