import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { DiscardConfirmPopupComponent } from 'src/app/popups/discard-confirm-popup/discard-confirm-popup.component';
import { BookingService } from 'src/app/services/booking.service';
import { ErrorService } from 'src/app/services/error.service';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { MockValues } from 'src/app/testing/data/test-objects';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { EndpointsComponent } from './endpoints.component';

function initHearingRequest(): HearingModel {
  const newHearing = new HearingModel();
  newHearing.hearing_type_id = -1;
  newHearing.hearing_venue_id = -1;
  newHearing.scheduled_duration = 0;
  return newHearing;
}

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let routerSpy: jasmine.SpyObj<Router>;
const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);
let bookingServiceSpy: jasmine.SpyObj<BookingService>;

describe('EndpointsComponent', () => {
  let component: EndpointsComponent;
  let fixture: ComponentFixture<EndpointsComponent>;

  const newHearing = initHearingRequest();

  beforeEach(async(() => {
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
      ['getHearingTypes', 'getCurrentRequest', 'updateHearingRequest', 'setBookingHasChanged']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
    bookingServiceSpy = jasmine.createSpyObj('BookingSErvice', ['isEditMode', 'resetEditMode', 'removeEditMode']);

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      providers: [
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ErrorService, useValue: errorService },
        { provide: BookingService, useValue: bookingServiceSpy },
      ],
      declarations: [EndpointsComponent, BreadcrumbComponent,
        CancelPopupComponent, DiscardConfirmPopupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should get booking data from storage', () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.hearing).toBeTruthy();
  });
  it('should set return a form array', () => {
    component.ngOnInit();
    expect(component.endpoints).toBeTruthy();
  });
  it('should naviagate to the other information page when next clicked', () => {
    component.ngOnInit();
    component.saveEndpoints();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
  });
  it('should show a confirmation popup if cancel clicked in new mode', () => {
    bookingServiceSpy.isEditMode.and.returnValue(false);
    component.ngOnInit();
    component.cancelBooking();
    expect(component.attemptingCancellation).toBeTruthy();
  });
  it('should return to summary screen if cancel clicked in edit mode with no updates', () => {
    bookingServiceSpy.isEditMode.and.returnValue(true);
    component.ngOnInit();
    component.cancelBooking();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
  });
  it('should show a confirmation popup if cancel clicked in edit mode with updates', () => {
    bookingServiceSpy.isEditMode.and.returnValue(true);
    component.ngOnInit();
    component.form.markAsTouched();
    component.cancelBooking();
    expect(component.attemptingCancellation).toBeTruthy();
  });
  it('should check for duplicate display names', () => {
    component.ngOnInit();
    fixture.detectChanges();
    component.hearing.endpoints = [];
    const ep1 = new EndpointModel();
    ep1.displayName = 'test endpoint 001';
    const ep2 = new EndpointModel();
    ep2.displayName = 'test endpoint 002';
    const ep3 = new EndpointModel();
    ep3.displayName = 'test endpoint 001';
    component.hearing.endpoints.push(ep1);
    component.hearing.endpoints.push(ep2);
    component.hearing.endpoints.push(ep3);
    console.log(component.hearing.endpoints);

    const result = component.hasDuplicateDisplayName(component.hearing.endpoints);
    expect(result).toBe(true);
  });
  it('it should validate form array on clicking add another', () => {
    component.ngOnInit();
    fixture.detectChanges();
    component.hearing.endpoints = [];
    const ep1 = new EndpointModel();
    ep1.displayName = 'test endpoint 001';
    const ep2 = new EndpointModel();
    ep2.displayName = 'test endpoint 002';
    const ep3 = new EndpointModel();
    ep3.displayName = 'test endpoint 001';
    component.hearing.endpoints.push(ep1);
    component.hearing.endpoints.push(ep2);
    component.hearing.endpoints.push(ep3);
    console.log(component.hearing.endpoints);
    component.addEndpoint();
    expect(component.failedValidation).toBe(true);
  });
});
