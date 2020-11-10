import { Location } from '@angular/common';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { MomentModule } from 'ngx-moment';
import { LongDatetimePipe } from '../../app/shared/directives/date-time.pipe';
import { CancelBookingPopupComponent } from '../popups/cancel-booking-popup/cancel-booking-popup.component';
import { ConfirmBookingFailedPopupComponent } from '../popups/confirm-booking-failed-popup/confirm-booking-failed-popup.component';
import { WaitPopupComponent } from '../popups/wait-popup/wait-popup.component';
import { AdminGuard } from '../security/admin.guard';
import { AuthGuard } from '../security/auth.gaurd';
import { Logger } from '../services/logger';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { MockAdminGuard } from '../testing/mocks/MockAdminGuard';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { BookingParticipantListComponent } from './booking-participant-list/booking-participant-list.component';
import { routes } from './bookings-list-routing.module';
import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { HearingDetailsComponent } from './hearing-details/hearing-details.component';
import { ParticipantDetailsComponent } from './participant-details/participant-details.component';

describe('BookingsListRouting', () => {
    let location: Location;
    let router: Router;
    let fixture: ComponentFixture<BookingsListComponent>;
    let bookingsList: BookingsListComponent;
    let adalSvc;
    let bookingGuard;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn', 'info']);

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
                { provide: AdalService, useClass: MockAdalService },
                HttpClient,
                HttpHandler,
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        fixture = TestBed.createComponent(BookingsListComponent);
        bookingsList = fixture.componentInstance;
        adalSvc = TestBed.inject(AdalService);
        bookingGuard = TestBed.inject(AdminGuard);
    });

    describe('admin can navigate to booking list', () => {
        it('it should be able to navigate to bookings list', fakeAsync(() => {
            adalSvc.setAuthenticated(true);
            bookingGuard.setflag(true);
            bookingsList.ngOnInit();

            router.navigate(['']);
            expect(location.path()).toBe('');
        }));
    });
});
