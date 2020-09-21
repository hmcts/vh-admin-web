import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
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
      ['getHearingTypes', 'getCurrentRequest', 'updateHearingRequest', 'setBookingHasChanged', 'cancelRequest']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
    videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
    bookingServiceSpy = jasmine.createSpyObj('BookingService', ['isEditMode', 'resetEditMode', 'removeEditMode']);

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
  it('should show a confirmation popup if cancel clicked in edit mode', () => {
    bookingServiceSpy.isEditMode.and.returnValue(true);
    component.ngOnInit();
    component.cancelBooking();
    expect(component.attemptingCancellation).toBeFalsy();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
  });
  it('should show a confirmation popup if cancel clicked in edit mode with updates', () => {
    bookingServiceSpy.isEditMode.and.returnValue(true);
    component.ngOnInit();
    component.form.markAsTouched();
    component.cancelBooking();
    expect(component.attemptingDiscardChanges).toBeTruthy();
  });
  it('should close the confirmation popup and stay on page in new mode and continue booking clicked', () => {
    bookingServiceSpy.isEditMode.and.returnValue(false);
    component.attemptingCancellation = true;
    component.continueBooking();
    expect(component.attemptingCancellation).toBeFalsy();
  });
  it('should close the confirmation popup and navigate to dashboard in new mode and discard changes clicked', () => {
    bookingServiceSpy.isEditMode.and.returnValue(false);
    component.attemptingCancellation = true;
    component.cancelEndpoints();
    expect(component.attemptingCancellation).toBeFalsy();
    expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
  it('should close the confirmation popup and stay on page in edit mode and continue booking clicked', () => {
    bookingServiceSpy.isEditMode.and.returnValue(true);
    component.attemptingDiscardChanges = true;
    component.continueBooking();
    expect(component.attemptingDiscardChanges).toBeFalsy();
  });
  it('should close the confirmation popup and navigate to summary in edit mode and discard changes clicked', () => {
    bookingServiceSpy.isEditMode.and.returnValue(false);
    component.attemptingDiscardChanges = true;
    component.cancelChanges();
    expect(component.attemptingDiscardChanges).toBeFalsy();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
  });
  it('it should validate display names on add another click and show error for duplicates', () => {
    component.ngOnInit();
    component.endpoints.controls[0].get('displayName').setValue('200');
    component.addEndpoint();
    component.endpoints.controls[1].get('displayName').setValue('200');
    component.addEndpoint();
    expect(component.duplicateDa).toBe(true);
    expect(component.failedValidation).toBe(true);
  });
  it('it should validate display names on next click and show error for duplicates', () => {
    component.ngOnInit();
    component.endpoints.controls[0].get('displayName').setValue('200');
    component.addEndpoint();
    component.endpoints.controls[1].get('displayName').setValue('200');
    component.saveEndpoints();
    expect(component.duplicateDa).toBe(true);
    expect(component.failedValidation).toBe(true);
  });
  it('it should validate display names on next click and navigate to other information page if validations pass', () => {
    component.ngOnInit();
    component.endpoints.controls[0].get('displayName').setValue('200');
    component.addEndpoint();
    component.endpoints.controls[1].get('displayName').setValue('201');
    component.saveEndpoints();
    expect(component.duplicateDa).toBe(false);
    expect(component.failedValidation).toBe(false);
    expect(component.hearing.endpoints[0].displayName).toBe('200');
    expect(component.hearing.endpoints[1].displayName).toBe('201');
    expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
  });
  it('it should validate display names, defence advocate on next click and navigate to other information page for defence adv none', () => {
    component.ngOnInit();
    component.endpoints.controls[0].get('displayName').setValue('200');
    component.saveEndpoints();
    expect(component.duplicateDa).toBe(false);
    expect(component.duplicateDefAdv).toBe(false);
    expect(component.failedValidation).toBe(false);
    expect(component.hearing.endpoints[0].displayName).toBe('200');
    expect(component.hearing.endpoints[0].defenceAdvocate).toBe('');
    expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
  });

  it('it should validate defence advocate on add another click and show error for duplicates', () => {
    component.ngOnInit();
    component.endpoints.controls[0].get('displayName').setValue('200');
    component.endpoints.controls[0].get('defenceAdvocate').setValue('username@email.com');
    component.addEndpoint();
    component.endpoints.controls[1].get('displayName').setValue('201');
    component.endpoints.controls[1].get('defenceAdvocate').setValue('username@email.com');
    component.addEndpoint();
    expect(component.duplicateDefAdv).toBe(true);
    expect(component.failedValidation).toBe(true);
  });
  it('it should validate display names on next click and show error for duplicates', () => {
    component.ngOnInit();
    component.endpoints.controls[0].get('displayName').setValue('200');
    component.endpoints.controls[0].get('defenceAdvocate').setValue('username@email.com');
    component.addEndpoint();
    component.endpoints.controls[1].get('displayName').setValue('201');
    component.endpoints.controls[1].get('defenceAdvocate').setValue('username@email.com');
    component.saveEndpoints();
    expect(component.duplicateDefAdv).toBe(true);
    expect(component.failedValidation).toBe(true);
  });
  it('it should validate fields on next click and navigate to other information page if validations pass', () => {
    component.ngOnInit();
    component.endpoints.controls[0].get('displayName').setValue('200');
    component.endpoints.controls[0].get('defenceAdvocate').setValue('username@email.com');
    component.addEndpoint();
    component.endpoints.controls[1].get('displayName').setValue('201');
    component.endpoints.controls[1].get('defenceAdvocate').setValue('username1@email.com');
    component.saveEndpoints();
    expect(component.duplicateDa).toBe(false);
    expect(component.duplicateDefAdv).toBe(false);
    expect(component.failedValidation).toBe(false);
    expect(component.hearing.endpoints[0].displayName).toBe('200');
    expect(component.hearing.endpoints[0].defenceAdvocate).toBe('username@email.com');
    expect(component.hearing.endpoints[1].displayName).toBe('201');
    expect(component.hearing.endpoints[1].defenceAdvocate).toBe('username1@email.com');
    expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
  });

  it('it should validate form array on next click and navigate to summary page in edit mode', () => {
    bookingServiceSpy.isEditMode.and.returnValue(true);
    component.ngOnInit();
    const existinghearing = new HearingModel();
    existinghearing.case_type = 'Case type';
    const eps: EndpointModel[] = [];
    let ep = new EndpointModel();
    ep.displayName = 'displayname1';
    ep.defenceAdvocate = '12345';
    eps.push(ep);
    ep = new EndpointModel();
    ep.displayName = 'displayname1';
    ep.defenceAdvocate = '11223';
    existinghearing.endpoints = eps;

    component.hearing = existinghearing;

    component.endpoints.controls[0].get('displayName').setValue('new display name');
    component.endpoints.controls[0].get('defenceAdvocate').setValue('user@email.com');
    component.saveEndpoints();
    expect(component.failedValidation).toBe(false);
    expect(component.hearing.endpoints[0].displayName).toBe('new display name');
    expect(component.hearing.endpoints[0].defenceAdvocate).toBe('user@email.com');
    expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
  });

  it('it should remove an endpoint from the endpoint array on remove click', () => {
    component.ngOnInit();
    component.endpoints.controls[0].get('displayName').setValue('200');
    component.endpoints.controls[0].get('defenceAdvocate').setValue('username@email.com');
    component.addEndpoint();
    component.endpoints.controls[1].get('displayName').setValue('201');
    component.endpoints.controls[1].get('defenceAdvocate').setValue('username1@email.com');
    component.addEndpoint();
    component.endpoints.controls[2].get('displayName').setValue('202');
    component.endpoints.controls[2].get('defenceAdvocate').setValue('username2@email.com');

    component.removeEndpoint(1);
    component.saveEndpoints();
    expect(component.hearing.endpoints.length).toBe(2);
  });
  it('should map participant list to defence advocate model', () => {
    const participantModel = new ParticipantModel();
    participantModel.id = '1000';
    participantModel.username = 'username@email.com';
    participantModel.display_name = 'display name';
    component.ngOnInit();
    const dA = component.mapParticipantsToDefenceAdvocateModel(participantModel);
    expect(dA).toBeTruthy();
    expect(dA.id).toBe('1000');
    expect(dA.username).toBe('username@email.com');
    expect(dA.displayName).toBe('display name');
    expect(dA.isSelected).toBe(null);
  });
  it('should return the username from id', () => {
    const participantModel = new ParticipantModel();
    participantModel.id = '1000';
    participantModel.username = 'username@email.com';
    participantModel.display_name = 'display name';
    component.hearing.participants.push(participantModel);
    component.ngOnInit();
    let result = component.getUsernameFromId('1000');
    expect(result).toBe('username@email.com');
    result = component.getUsernameFromId('1001');
    expect(result).toBe('1001');
  });
  it('should unsubscribe all subcription on destroy', () => {
    component.ngOnDestroy();
    expect(component.$subscriptions[0].closed).toBe(true);
  });
});
