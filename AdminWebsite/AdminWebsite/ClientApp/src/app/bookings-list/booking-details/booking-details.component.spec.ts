import { ComponentFixture, TestBed, async, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

import { Component, Input } from '@angular/core';
import { BookingDetailsComponent } from './booking-details.component';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingDetailsService } from '../../services/booking-details.service';
import { BookingService } from '../../services/booking.service';
import {
  HearingDetailsResponse, UpdateBookingStatusRequest,
  UpdateBookingStatusRequestStatus, UserProfileResponse
} from '../../services/clients/api-client';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { of, Observable } from 'rxjs';
import { HearingModel } from '../../common/model/hearing.model';
import { CaseModel } from '../../common/model/case.model';
import { PageUrls } from '../../shared/page-url.constants';
import { CancelBookingPopupComponent } from 'src/app/popups/cancel-booking-popup/cancel-booking-popup.component';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { UserIdentityService } from '../../services/user-identity.service';
import { ErrorService } from 'src/app/services/error.service';


let component: BookingDetailsComponent;
let fixture: ComponentFixture<BookingDetailsComponent>;
let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let routerSpy: jasmine.SpyObj<Router>;
let bookingServiceSpy: jasmine.SpyObj<BookingService>;
let bookingPersistServiceSpy: jasmine.SpyObj<BookingPersistService>;
let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;

export class BookingDetailsTestData {
  getBookingsDetailsModel() {
    return new BookingsDetailsModel('44', new Date('2019-11-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', '', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', true);
  }

  getParticipants() {
    const participants: Array<ParticipantDetailsModel> = [];
    const judges: Array<ParticipantDetailsModel> = [];
    const p1 = new ParticipantDetailsModel('1', 'Mrs', 'Alan', 'Brake', 'Judge', 'email.p1@email.com',
      'email1@co.uk', 'Claimant', 'Solicitor', 'Alan Brake', '', 'ABC Solicitors', 'new Solicitor', 'defendant');
    const p2 = new ParticipantDetailsModel('2', 'Mrs', 'Roy', 'Bark', 'Citizen', 'email.p2@email.com',
      'email2@co.uk', 'Claimant', 'Claimant LIP', 'Roy Bark', '', 'ABC Solicitors', 'new Solicitor', 'defendant');
    const p3 = new ParticipantDetailsModel('2', 'Mrs', 'Fill', 'Green', 'Professional', 'email.p3@email.com',
      'email3@co.uk', 'Defendant', 'Defendant LIP', 'Fill', '', 'ABC Solicitors', 'new Solicitor', 'defendant');
    participants.push(p2);
    participants.push(p3);
    judges.push(p1);
    return { judges: judges, participants: participants };
  }
}

@Component({
  selector: 'app-booking-participant-list',
  template: ''
})
class BookingParticipantListMockComponent {
  @Input()
  participants: Array<ParticipantDetailsModel> = [];

  @Input()
  judges: Array<ParticipantDetailsModel> = [];

  @Input()
  vh_officer_admin: boolean;
}

@Component({
  selector: 'app-hearing-details',
  template: ''
})
class HearingDetailsMockComponent {
  @Input()
  hearing: BookingsDetailsModel;
}

const hearingResponse = new HearingDetailsResponse();

const caseModel = new CaseModel();
caseModel.name = 'X vs Y';
caseModel.number = 'XX3456234565';
const hearingModel = new HearingModel();
hearingModel.hearing_id = '44';
hearingModel.cases = [caseModel];
hearingModel.scheduled_duration = 120;
let now = new Date();
now.setMonth(now.getMonth());
now = new Date(now);
hearingModel.scheduled_date_time = now;
hearingModel.questionnaire_not_required = true;

const updateBookingStatusRequest = new UpdateBookingStatusRequest();
updateBookingStatusRequest.status = UpdateBookingStatusRequestStatus.Cancelled;

class BookingDetailsServiceMock {
  mapBooking(response) {
    return new BookingDetailsTestData().getBookingsDetailsModel();
  }
  mapBookingParticipants(response) {
    return new BookingDetailsTestData().getParticipants();
  }
}


describe('BookingDetailsComponent', () => {

  videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingService',
    ['getHearingById', 'saveHearing', 'mapHearingDetailsResponseToHearingModel',
      'updateHearingRequest', 'updateBookingStatus', 'getCurrentRequest']);
  routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  bookingServiceSpy = jasmine.createSpyObj('BookingService', ['setEditMode',
    'resetEditMode', 'setExistingCaseType', 'removeExistingCaseType']);
  bookingPersistServiceSpy = jasmine.createSpyObj('BookingPersistService', ['selectedHearingId']);
  userIdentityServiceSpy = jasmine.createSpyObj('UserIdentityService', ['getUserInformation']);
  const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);

  beforeEach(async(() => {
    videoHearingServiceSpy.getHearingById.and.returnValue(of(hearingResponse));
    videoHearingServiceSpy.updateBookingStatus.and.returnValue(of());
    videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel.and.returnValue(hearingModel);
    videoHearingServiceSpy.getCurrentRequest.and.returnValue(hearingModel);

    bookingPersistServiceSpy.selectedHearingId.and.returnValue('44');
    userIdentityServiceSpy.getUserInformation.and.returnValue(of(true));

    TestBed.configureTestingModule({
      declarations: [
        BookingDetailsComponent,
        BookingParticipantListMockComponent,
        HearingDetailsMockComponent,
        CancelBookingPopupComponent
      ],
      imports: [HttpClientModule],
      providers: [
        { provide: VideoHearingsService, useValue: videoHearingServiceSpy },
        { provide: BookingDetailsService, useClass: BookingDetailsServiceMock },
        { provide: Router, useValue: routerSpy },
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: BookingPersistService, useValue: bookingPersistServiceSpy },
        { provide: UserIdentityService, useValue: userIdentityServiceSpy },
        { provide: ErrorService, useValue: errorService },
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(BookingDetailsComponent);
    component = fixture.componentInstance;
    component.hearingId = '1';
    fixture.detectChanges();
  }));

  it('should create component', fakeAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should get hearings details', fakeAsync(() => {
    component.ngOnInit();
    expect(videoHearingServiceSpy.getHearingById).toHaveBeenCalled();
    expect(component.hearing).toBeTruthy();
    expect(component.hearing.HearingId).toBe('44');
    expect(component.hearing.Duration).toBe(120);
    expect(component.hearing.HearingCaseNumber).toBe('XX3456234565');
    expect(component.hearing.QuestionnaireNotRequired).toBeTruthy();
  }));

  it('should get hearings details and map to HearingModel', (() => {
    component.ngOnInit();
    expect(videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel).toHaveBeenCalled();
    expect(component.booking).toBeTruthy();
    expect(component.booking.hearing_id).toBe('44');
    expect(component.booking.scheduled_duration).toBe(120);
    expect(component.booking.cases[0].number).toBe('XX3456234565');
    expect(component.hearing.QuestionnaireNotRequired).toBeTruthy();
  }));
  it('should call service to map hearing response to HearingModel', (() => {
    component.mapResponseToModel(new HearingDetailsResponse());
    expect(videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel).toHaveBeenCalled();
  }));

  it('should get judge details', (() => {
    component.ngOnInit();
    expect(component.judges).toBeTruthy();
    expect(component.judges.length).toBe(1);
    expect(component.judges[0].UserRoleName).toBe('Judge');
    expect(component.judges[0].ParticipantId).toBe('1');
    expect(component.judges[0].FirstName).toBe('Alan');
  }));

  it('should get participants details', (() => {
    component.ngOnInit();
    expect(component.participants).toBeTruthy();
    expect(component.participants.length).toBe(2);
    expect(component.participants[0].UserRoleName).toBe('Citizen');
    expect(component.participants[0].ParticipantId).toBe('2');
  }));
  it('should set edit mode if the edit button pressed', () => {
    component.editHearing();
    expect(videoHearingServiceSpy.updateHearingRequest).toHaveBeenCalled();
    expect(bookingServiceSpy.resetEditMode).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith([PageUrls.Summary]);
  });
  it('should update hearing status when cancel booking called', () => {
    component.ngOnInit();
    component.cancelBooking();
    expect(component.showCancelBooking).toBeFalsy();
    console.log(videoHearingServiceSpy);
    expect(videoHearingServiceSpy.updateBookingStatus)
      .toHaveBeenCalledWith(bookingPersistServiceSpy.selectedHearingId, updateBookingStatusRequest);
    expect(videoHearingServiceSpy.getHearingById)
      .toHaveBeenCalled();
  });
  it('should show pop up if the cancel button was clicked', () => {
    component.cancelHearing();
    expect(component.showCancelBooking).toBeTruthy();
  });
  it('should hide pop up if the keep booking button was clicked', () => {
    component.cancelHearing();
    expect(component.showCancelBooking).toBeTruthy();
    component.keepBooking();
    expect(component.showCancelBooking).toBeFalsy();
  });
  it('should set confirmation button not visible if hearing start time less than 30 min', fakeAsync(() => {
    component.booking.scheduled_date_time = new Date(Date.now());
    component.timeSubscription = new Observable<any>().subscribe();
    component.setTimeObserver();
    expect(component.isConfirmationTimeValid).toBeFalsy();
  }));
  it('should not reset confirmation button if current booking is not set', fakeAsync(() => {
    component.booking = undefined;
    component.isConfirmationTimeValid = true;
    component.setTimeObserver();
    expect(component.isConfirmationTimeValid).toBeTruthy();
  }));
  it('should confirm booking', () => {
    component.isVhOfficerAdmin = true;
    component.confirmHearing();
    expect(videoHearingServiceSpy.getHearingById).toHaveBeenCalled();
  });
  it('should show that user role is Vh office admin', () => {
    const profile = new UserProfileResponse({ is_vh_officer_administrator_role: true });
    component.getUserRole(profile);
    expect(component.isVhOfficerAdmin).toBeTruthy();
  });
  it('should show that user role is not Vh office admin', () => {
    const profile = new UserProfileResponse({ is_vh_officer_administrator_role: false });
    component.getUserRole(profile);
    expect(component.isVhOfficerAdmin).toBeFalsy();
  });
  it('should not confirm booking if not the VH officer admin role', () => {
    component.isVhOfficerAdmin = false;
    component.confirmHearing();
    expect(component.booking.status).toBeFalsy();
  });
  it('should persist status in the model', () => {
    component.booking = null;
    component.persistStatus(UpdateBookingStatusRequestStatus.Created);
    expect(component.booking.status).toBe(UpdateBookingStatusRequestStatus.Created);
    expect(videoHearingServiceSpy.updateHearingRequest).toHaveBeenCalled();
  });
  it('should hide cancel button for canceled hearing', () => {
    component.updateStatusHandler(UpdateBookingStatusRequestStatus.Cancelled);
    expect(component.showCancelBooking).toBeFalsy();
  });
  it('should not hide cancel button for not canceled hearing', () => {
    component.showCancelBooking = true;
    component.updateStatusHandler(UpdateBookingStatusRequestStatus.Created);
    expect(component.showCancelBooking).toBeTruthy();
  });
  it('should hide cancel button for canceled error', () => {
    component.errorHandler('error', UpdateBookingStatusRequestStatus.Cancelled);
    expect(component.showCancelBooking).toBeFalsy();
  });
  it('should not hide cancel button for not canceled error', () => {
    component.showCancelBooking = true;
    component.errorHandler('error', UpdateBookingStatusRequestStatus.Created);
    expect(component.showCancelBooking).toBeTruthy();
  });
  it('should navigate back', () => {
    component.navigateBack();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('should set confirmation button visible if hearing start time more than 30 min', fakeAsync(() => {
    let current = new Date();
    current.setMinutes(current.getMinutes() + 31);
    current = new Date(current);
    component.booking.scheduled_date_time = current;
    component.setTimeObserver();
    tick();
    expect(component.isConfirmationTimeValid).toBeTruthy();
  }));
});

