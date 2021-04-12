import { routes } from './booking-routing.module';
import { Location } from '@angular/common';
import { TestBed, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthGuard } from '../security/auth.guard';
import { AdminGuard } from '../security/admin.guard';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ChangesGuard } from '../common/guards/changes.guard';
import { MockChangesGuard } from '../testing/mocks//MockChangesGuard';
import { MockAdminGuard } from '../testing/mocks/MockAdminGuard';

import { CreateHearingComponent } from './create-hearing/create-hearing.component';
import { CancelPopupComponent } from '../popups/cancel-popup/cancel-popup.component';
import { ConfirmationPopupComponent } from '../popups/confirmation-popup/confirmation-popup.component';
import { ErrorService } from '../services/error.service';
import { WaitPopupComponent } from '../popups/wait-popup/wait-popup.component';
import { SaveFailedPopupComponent } from '../popups/save-failed-popup/save-failed-popup.component';
import { DiscardConfirmPopupComponent } from '../popups/discard-confirm-popup/discard-confirm-popup.component';
import { Components } from './booking.module';
import { SharedModule } from '../shared/shared.module';
import { ConfirmBookingFailedPopupComponent } from '../popups/confirm-booking-failed-popup/confirm-booking-failed-popup.component';
import { Logger } from '../services/logger';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { MockOidcSecurityService } from '../testing/mocks/MockOidcSecurityService';

describe('BookingModuleRouting', () => {
    let location: Location;
    let router: Router;
    let fixture: ComponentFixture<CreateHearingComponent>;
    let createHearing: CreateHearingComponent;
    let changesGuard;
    let bookingGuard;
    let oidcSecurityService;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
    const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, RouterTestingModule.withRoutes(routes), FormsModule, SharedModule],
            declarations: [
                CancelPopupComponent,
                DiscardConfirmPopupComponent,
                ConfirmationPopupComponent,
                WaitPopupComponent,
                SaveFailedPopupComponent,
                ConfirmBookingFailedPopupComponent,
                ...Components
            ],
            providers: [
                AuthGuard,
                { provide: AdminGuard, useClass: MockAdminGuard },
                { provide: OidcSecurityService, useClass: MockOidcSecurityService },
                { provide: ChangesGuard, useClass: MockChangesGuard },
                { provide: Logger, useValue: loggerSpy },
                HttpClient,
                HttpHandler,
                { provide: ErrorService, useValue: errorService }
            ]
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        fixture = TestBed.createComponent(CreateHearingComponent);
        createHearing = fixture.componentInstance;
        changesGuard = TestBed.inject(ChangesGuard);
        bookingGuard = TestBed.inject(AdminGuard);
        oidcSecurityService = TestBed.inject(OidcSecurityService);
    });

    describe('when create hearing', () => {
        it('it should be able to navigate away from current route', fakeAsync(() => {
            oidcSecurityService.setAuthenticated(true);
            changesGuard.setflag(true);
            bookingGuard.setflag(true);
            createHearing.ngOnInit();
            router.navigate(['/book-hearing']);
            tick();
            createHearing.form.markAsPristine();
            router.navigate(['/hearing-schedule']);
            tick();
            expect(location.path()).toBe('/hearing-schedule');
        }));
    });
});
