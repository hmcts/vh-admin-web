import { Location } from '@angular/common';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { MomentModule } from 'ngx-moment';
import { LongDatetimePipe } from '../../app/shared/directives/date-time.pipe';
import { CancelBookingPopupComponent } from '../popups/cancel-booking-popup/cancel-booking-popup.component';
import { ConfirmBookingFailedPopupComponent } from '../popups/confirm-booking-failed-popup/confirm-booking-failed-popup.component';
import { WaitPopupComponent } from '../popups/wait-popup/wait-popup.component';
import { ConfigService } from '../services/config.service';
import { Logger } from '../services/logger';
import { MockAdminGuard } from '../testing/mocks/MockAdminGuard';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { BookingParticipantListComponent } from './booking-participant-list/booking-participant-list.component';
import { routes } from './bookings-list-routing.module';
import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { HearingDetailsComponent } from './hearing-details/hearing-details.component';
import { ParticipantDetailsComponent } from './participant-details/participant-details.component';
import { DatePipe } from '@angular/common';
import { ClientSettingsResponse } from '../services/clients/api-client';
import { of } from 'rxjs';
import { AuthGuard } from '../security/guards/auth.guard';
import { AdminGuard } from '../security/guards/admin.guard';
import { MockSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { IdpProviders } from '../security/services/security.service';

describe('BookingsListRouting', () => {
    let location: Location;
    let router: Router;
    let fixture: ComponentFixture<BookingsListComponent>;
    let bookingsList: BookingsListComponent;
    let oidcSecurityService;
    let bookingGuard;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn', 'info']);
    const configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getConfig', 'getClientSettings']);
    const clientSettingsResponse = new ClientSettingsResponse({ launch_darkly_client_id: 'client_id' });
    configServiceSpy.getConfig.and.returnValue(clientSettingsResponse);
    configServiceSpy.getClientSettings.and.returnValue(of(clientSettingsResponse));
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes(routes), MomentModule, ReactiveFormsModule],
            declarations: [
                BookingsListComponent,
                BookingDetailsComponent,
                BookingParticipantListComponent,
                ParticipantDetailsComponent,
                HearingDetailsComponent,
                LongDatetimePipe,
                CancelBookingPopupComponent,
                WaitPopupComponent,
                ConfirmBookingFailedPopupComponent
            ],
            providers: [
                AuthGuard,
                { provide: AdminGuard, useClass: MockAdminGuard },
                { provide: OidcSecurityService, useClass: MockSecurityService },
                HttpClient,
                HttpHandler,
                { provide: Logger, useValue: loggerSpy },
                { provide: ConfigService, useValue: configServiceSpy },
                DatePipe
            ]
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        fixture = TestBed.createComponent(BookingsListComponent);
        bookingsList = fixture.componentInstance;
        oidcSecurityService = TestBed.inject(OidcSecurityService);
        bookingGuard = TestBed.inject(AdminGuard);
    });

    describe('admin can navigate to booking list', () => {
        it('it should be able to navigate to bookings list', fakeAsync(() => {
            oidcSecurityService.setAuthenticatedResult(IdpProviders.main, true);
            bookingGuard.setflag(true);
            bookingsList.ngOnInit();

            router.navigate(['']);
            expect(location.path()).toBe('');
        }));
    });
});
