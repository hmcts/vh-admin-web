import { routes } from './bookings-list-routing.module';
import { Location } from '@angular/common';
import { TestBed, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthGuard } from '../security/auth.gaurd';
import { AdminGuard } from '../security/admin.guard';

import { HttpClient, HttpHandler } from '@angular/common/http';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { MockAdminGuard } from '../testing/mocks/MockAdminGuard';

import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { BookingParticipantListComponent } from './booking-participant-list/booking-participant-list.component';
import { ParticipantDetailsComponent } from './participant-details/participant-details.component';
import { HearingDetailsComponent } from './hearing-details/hearing-details.component';


describe('app routing', () => {
  let location: Location;
  let router: Router;
  let fixture: ComponentFixture<BookingsListComponent>;
  let bookingsList: BookingsListComponent;
  let adalSvc;
  let bookingGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(routes)],
      declarations: [
        BookingsListComponent,
        BookingDetailsComponent,
        BookingParticipantListComponent,
        ParticipantDetailsComponent,
        HearingDetailsComponent,
      ],
      providers: [
        AuthGuard,
        { provide: AdminGuard, useClass: MockAdminGuard },
        { provide: AdalService, useClass: MockAdalService },
         HttpClient, HttpHandler
      ],
    }).compileComponents();

    router = TestBed.get(Router);
    location = TestBed.get(Location);
    fixture = TestBed.createComponent(BookingsListComponent);
    bookingsList = fixture.componentInstance;
    adalSvc = TestBed.get(AdalService);
    bookingGuard = TestBed.get(AdminGuard);
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
