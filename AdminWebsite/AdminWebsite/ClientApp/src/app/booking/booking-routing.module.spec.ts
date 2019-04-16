import { routes } from './booking-routing.module';
import { Location } from '@angular/common';
import { TestBed, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthGuard } from '../security/auth.gaurd';
import { AdminGuard } from '../security/admin.guard';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ChangesGuard } from '../common/guards/changes.guard';
import { AdalService } from 'adal-angular4';
import { MockChangesGuard } from '../testing/mocks//MockChangesGuard';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { MockAdminGuard } from '../testing/mocks/MockAdminGuard';

import { CreateHearingComponent } from './create-hearing/create-hearing.component';
import { HearingScheduleComponent } from './hearing-schedule/hearing-schedule.component';
import { AssignJudgeComponent } from './assign-judge/assign-judge.component';
import { AddParticipantComponent } from './add-participant/add-participant.component';
import { OtherInformationComponent } from './other-information/other-information.component';
import { SummaryComponent } from './summary/summary.component';
import { BookingConfirmationComponent } from './booking-confirmation/booking-confirmation.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { SearchEmailComponent } from './search-email/search-email.component';
import { ParticipantsListComponent } from './participants-list/participants-list.component';
import { CancelPopupComponent } from '../popups/cancel-popup/cancel-popup.component';
import { ConfirmationPopupComponent } from '../popups/confirmation-popup/confirmation-popup.component';
import { BookingEditComponent } from '../shared/booking-edit/booking-edit.component';
import { ErrorService } from '../services/error.service';
import { RemovePopupComponent } from '../popups/remove-popup/remove-popup.component';
import { WaitPopupComponent } from '../popups/wait-popup/wait-popup.component';
import { SaveFailedPopupComponent } from '../popups/save-failed-popup/save-failed-popup.component';
import { DiscardConfirmPopupComponent } from '../popups/discard-confirm-popup/discard-confirm-popup.component';
import { MomentModule } from 'angular2-moment';
import { LongDatetimePipe } from '../../app/shared/directives/date-time.pipe';

describe('app routing', () => {
  let location: Location;
  let router: Router;
  let fixture: ComponentFixture<CreateHearingComponent>;
  let createHearing: CreateHearingComponent;
  let changesGuard;
  let adalSvc;
  let bookingGuard;
  const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule.withRoutes(routes), FormsModule, MomentModule],
      declarations: [
        BreadcrumbComponent,
        CancelPopupComponent,
        SearchEmailComponent,
        ParticipantsListComponent,
        HearingScheduleComponent,
        ConfirmationPopupComponent,
        AssignJudgeComponent,
        AddParticipantComponent,
        OtherInformationComponent,
        CreateHearingComponent,
        SummaryComponent,
        BookingConfirmationComponent,
        BookingEditComponent,
        RemovePopupComponent,
        WaitPopupComponent,
        SaveFailedPopupComponent,
        DiscardConfirmPopupComponent,
        LongDatetimePipe
      ],
      providers: [
        AuthGuard,
        { provide: AdminGuard, useClass: MockAdminGuard },
        { provide: AdalService, useClass: MockAdalService },
        { provide: ChangesGuard, useClass: MockChangesGuard }, HttpClient, HttpHandler,
        { provide: ErrorService, useValue: errorService },
      ],
    }).compileComponents();

    router = TestBed.get(Router);
    location = TestBed.get(Location);
    fixture = TestBed.createComponent(CreateHearingComponent);
    createHearing = fixture.componentInstance;
    changesGuard = TestBed.get(ChangesGuard);
    adalSvc = TestBed.get(AdalService);
    bookingGuard = TestBed.get(AdminGuard);
  });

  describe('when create hearing form is dirty', () => {
    it('it should not be able to navigate away from current route', fakeAsync(() => {
      adalSvc.setAuthenticated(true);
      changesGuard.setflag(false);
      bookingGuard.setflag(true);
      createHearing.ngOnInit();
      router.navigate(['/book-hearing']);
      tick();
      createHearing.hearingForm.markAsDirty();
      router.navigate(['/summary']);
      tick();
      expect(location.path()).toBe('/book-hearing');
    }));
  });

  describe('when create hearing form is prestine', () => {
    it('it should be able to navigate away from current route', fakeAsync(() => {
      adalSvc.setAuthenticated(true);
      changesGuard.setflag(true);
      bookingGuard.setflag(true);
      createHearing.ngOnInit();
      router.navigate(['/book-hearing']);
      tick();
      createHearing.hearingForm.markAsPristine();
      router.navigate(['/hearing-schedule']);
      tick();
      expect(location.path()).toBe('/hearing-schedule');
    }));
  });
});
