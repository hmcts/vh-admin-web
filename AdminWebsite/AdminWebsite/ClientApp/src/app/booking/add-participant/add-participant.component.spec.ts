import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';

import { of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { CancelPopupStubComponent } from 'src/app/testing/stubs/cancel-popup-stub';
import { ConfirmationPopupStubComponent } from 'src/app/testing/stubs/confirmation-popup-stub';
import { RemovePopupStubComponent } from '../../testing/stubs/remove-popup-stub';
import { DiscardConfirmPopupComponent } from '../../popups/discard-confirm-popup/discard-confirm-popup.component';

import { SearchServiceStub } from 'src/app/testing/stubs/service-service-stub';
import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { ParticipantService } from '../services/participant.service';
import { BookingService } from '../../services/booking.service';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { AddParticipantComponent } from './add-participant.component';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { CaseAndHearingRolesResponse } from '../../services/clients/api-client';
import { PartyModel } from '../../common/model/party.model';
import { Constants } from '../../common/constants';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { Address } from './address';
import { Logger } from '../../services/logger';

let component: AddParticipantComponent;
let fixture: ComponentFixture<AddParticipantComponent>;

const roleList: CaseAndHearingRolesResponse[] =
  [new CaseAndHearingRolesResponse({ name: 'Claimant', hearing_roles: ['Solicitor', 'Claimant LIP'] })];

const partyR = new PartyModel('Claimant');
partyR.hearingRoles = ['Solicitor', 'Claimant LIP'];
const partyList: PartyModel[] = [partyR];
const addressDummy = new Address();

let role: AbstractControl;
let party: AbstractControl;
let title: AbstractControl;
let firstName: AbstractControl;
let lastName: AbstractControl;
let phone: AbstractControl;
let displayName: AbstractControl;
let companyName: AbstractControl;
let companyNameIndividual: AbstractControl;
let representing: AbstractControl;
let solicitorReference: AbstractControl;

let houseNumber: AbstractControl;
let street: AbstractControl;
let city: AbstractControl;
let county: AbstractControl;
let postcode: AbstractControl;

const participants: ParticipantModel[] = [];

const p1 = new ParticipantModel();
p1.first_name = 'John';
p1.last_name = 'Doe';
p1.display_name = 'John Doe';
p1.is_judge = true;
p1.title = 'Mr.';
p1.email = 'test1@test.com';
p1.phone = '32332';
p1.hearing_role_name = 'Solicitor';
p1.case_role_name = 'Claimant';
p1.company = 'CN';
p1.housenumber = '';
p1.street = '';
p1.postcode = '';
p1.city = '';
p1.solicitorsReference = 'sol ref';
p1.representee = 'representee';

const p2 = new ParticipantModel();
p2.first_name = 'Jane';
p2.last_name = 'Doe';
p2.display_name = 'Jane Doe';
p2.is_judge = true;
p2.title = 'Mr.';
p2.email = 'test2@test.com';
p2.phone = '32332';
p2.hearing_role_name = 'Solicitor';
p2.case_role_name = 'Claimant';
p2.company = 'CN';
p2.housenumber = '';
p2.street = '';
p2.postcode = '';
p2.city = '';
p2.solicitorsReference = 'sol ref';
p2.representee = 'representee';

const p3 = new ParticipantModel();
p3.first_name = 'Chris';
p3.last_name = 'Green';
p3.display_name = 'Chris Green';
p3.is_judge = false;
p3.title = 'Mr.';
p3.email = 'test3@test.com';
p3.phone = '32332';
p3.hearing_role_name = 'Solicitor';
p3.case_role_name = 'Claimant';
p3.company = 'CN';

p3.housenumber = '';
p3.street = '';
p3.postcode = '';
p3.city = '';
p3.solicitorsReference = 'sol ref';
p3.id = '1234';
p3.representee = 'representee';

const p4 = new ParticipantModel();
p4.first_name = 'Test';
p4.last_name = 'Participant';
p4.display_name = 'Test Participant';
p4.is_judge = false;
p4.title = 'Mr.';
p4.email = 'test4@test.com';
p4.phone = '32332';
p4.hearing_role_name = 'Claimant LIP';
p4.case_role_name = 'Claimant';
p4.company = 'CN';
p4.housenumber = '1';
p4.street = 'Test Street';
p4.postcode = 'TE1 5NR';
p4.city = 'Test City';
p4.county = 'Test County';
p3.id = '1234';

participants.push(p1);
participants.push(p2);
participants.push(p3);
participants.push(p4);

const constants = Constants;

function initHearingRequest(): HearingModel {
  const newHearing = new HearingModel();
  newHearing.cases = [];
  newHearing.hearing_type_id = -1;
  newHearing.hearing_venue_id = -1;
  newHearing.scheduled_duration = 0;
  newHearing.participants = participants;
  return newHearing;
}

function initExistHearingRequest(): HearingModel {
  const newHearing = new HearingModel();
  newHearing.cases = [];
  newHearing.hearing_id = '12345';
  newHearing.hearing_type_id = 1;
  newHearing.hearing_venue_id = 1;
  newHearing.scheduled_duration = 20;
  newHearing.participants = participants;
  return newHearing;
}

const participant = new ParticipantModel();
participant.email = 'email@aa.aa';
participant.first_name = 'Sam';
participant.last_name = 'Green';
participant.phone = '12345';
participant.is_judge = false;
participant.display_name = 'Sam Green';
participant.title = 'Mr';
participant.hearing_role_name = 'Solicitor';
participant.case_role_name = 'Claimant';
participant.company = 'CN';
participant.housenumber = '1';
participant.street = 'Test Street';
participant.postcode = 'TE1 5NR';
participant.city = 'Test City';
participant.county = 'Test County';
participant.solicitorsReference = 'Test sol ref';
participant.representee = 'test representee';

const routerSpy: jasmine.SpyObj<Router> = {
  events: of(new NavigationEnd(2, '/', '/')),
  ...jasmine.createSpyObj<Router>(['navigate'])
} as jasmine.SpyObj<Router>;

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
let bookingServiceSpy: jasmine.SpyObj<BookingService>;
let loggerSpy: jasmine.SpyObj<Logger>;

loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error']);
participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService',
  ['checkDuplication', 'getAllParticipants', 'removeParticipant', 'mapParticipantsRoles']);

describe('AddParticipantComponent', () => {

  beforeEach(async(() => {
    const hearing = initHearingRequest();
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
      'getParticipantRoles', 'getCurrentRequest', 'setBookingHasChanged', 'updateHearingRequest', 'cancelRequest'
    ]);
    videoHearingsServiceSpy.getParticipantRoles.and.returnValue(Promise.resolve(roleList));
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
    participantServiceSpy = jasmine.createSpyObj<ParticipantService>(['mapParticipantsRoles', 'checkDuplication']);
    participantServiceSpy.mapParticipantsRoles.and.returnValue(partyList);
    bookingServiceSpy = jasmine.createSpyObj<BookingService>(['isEditMode', 'resetEditMode']);
    bookingServiceSpy.isEditMode.and.returnValue(false);

    const searchService = {
      ...new SearchServiceStub(),
      ...jasmine.createSpyObj<SearchService>(['search'])
    } as jasmine.SpyObj<SearchService>;

    component = new AddParticipantComponent(
      searchService,
      videoHearingsServiceSpy,
      participantServiceSpy,
      routerSpy,
      bookingServiceSpy,
      loggerSpy
    );
    component.searchEmail = new SearchEmailComponent(searchService);
    component.participantsListComponent = new ParticipantsListComponent(
      bookingServiceSpy, routerSpy
    );

    addressDummy.setDummyAddress();
    component.ngOnInit();

    role = component.form.controls['role'];
    party = component.form.controls['party'];
    title = component.form.controls['title'];
    firstName = component.form.controls['firstName'];
    lastName = component.form.controls['lastName'];
    phone = component.form.controls['phone'];
    displayName = component.form.controls['displayName'];
    companyName = component.form.controls['companyName'];
    houseNumber = component.form.controls['houseNumber'];
    street = component.form.controls['street'];
    city = component.form.controls['city'];
    county = component.form.controls['county'];
    postcode = component.form.controls['postcode'];
    solicitorReference = component.form.controls['solicitorReference'];
    representing = component.form.controls['representing'];
  }));

  it('should initialize edit mode as false and value of button set to next', () => {
    component.ngOnInit();
    expect(component.editMode).toBeFalsy();
    expect(component.buttonAction).toBe('Next');
    expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
  });
  it('should set case role list, hearing role list and title list', fakeAsync(() => {
    component.ngOnInit();
    component.ngAfterViewInit();
    tick(600);
    expect(component.roleList).toBeTruthy();
    expect(component.roleList.length).toBe(2);
    expect(component.titleList).toBeTruthy();
    expect(component.titleList.length).toBe(2);
  }));

  it('considers the email valid if the field is not displayed', () => {
    component.searchEmail = null;
    expect(component.validEmail()).toBe(true);
  });

  it('considers email valid if an email with valid format is assigned', () => {
    component.showDetails = true;
    component.searchEmail.email = 'valid@email.com';
    expect(component.validEmail()).toBe(true);
  });

  it('has invalid email if email format is wrong', () => {
    component.showDetails = true;
    component.searchEmail.email = 'validemail.com';
    expect(component.validEmail()).toBe(false);
  });

  it('should set initial values for fields', fakeAsync(() => {
    component.ngOnInit();
    tick(500);
    expect(role.value).toBe(Constants.PleaseSelect);
    expect(party.value).toBe(Constants.PleaseSelect);
    expect(firstName.value).toBe('');
    expect(lastName.value).toBe('');
    expect(phone.value).toBe('');
    expect(title.value).toBe(Constants.PleaseSelect);
    expect(companyName.value).toBe('');
    expect(houseNumber.value).toBe(addressDummy.houseNumber);
    expect(street.value).toBe(addressDummy.street);
    expect(city.value).toBe(addressDummy.city);
    expect(county.value).toBe(addressDummy.county);
    expect(postcode.value).toBe(addressDummy.postcode);
    expect(component.showAddress).toBeFalsy();
  }));
  it('should set validation to false when form is empty', () => {
    expect(component.form.valid).toBeFalsy();
  });
  it('should set validation summary be visible if any field is invalid', () => {
    component.showDetails = true;
    component.saveParticipant();
    expect(component.isShowErrorSummary).toBeTruthy();
  });
  it('should validate first name', () => {
    expect(firstName.valid).toBeFalsy();
    firstName.setValue('Sam');
    expect(firstName.valid).toBeTruthy();
  });
  it('should validate last name', () => {
    expect(lastName.valid).toBeFalsy();
    lastName.setValue('Sam');
    expect(lastName.valid).toBeTruthy();
  });
  it('should validate phone', () => {
    expect(phone.valid).toBeFalsy();
    phone.setValue('123456');
    expect(phone.valid).toBeTruthy();
  });
  it('should check if the role is valid role', () => {
    role.setValue(Constants.PleaseSelect);
    component.roleSelected();
    expect(role.valid && component.isRoleSelected).toBeFalsy();
    role.setValue('Appellant');
    component.roleSelected();
    expect(role.valid && component.isRoleSelected).toBeTruthy();
  });
  it('should validate house number', () => {
    isAddressControlValid(houseNumber, '123');
  });

  it('should validate street', () => {
    isAddressControlValid(street, 'Test Street');
  });

  it('should validate city', () => {
    isAddressControlValid(county, 'Test City');
  });

  it('should validate county', () => {
    isAddressControlValid(city, 'Test County');
  });

  it('should validate postcode', () => {
    isAddressControlValid(postcode, 'TE1 5NR');
  });
  it('should reset undefined value for party and role to Please select', () => {
    participant.case_role_name = undefined;
    participant.hearing_role_name = undefined;
    component.getParticipant(participant);

    expect(component.participantDetails.case_role_name).toBeTruthy();
    expect(component.participantDetails.case_role_name).toEqual(Constants.PleaseSelect);
    expect(component.participantDetails.hearing_role_name).toEqual(Constants.PleaseSelect);
  });
  it('should reset empty party and role to Please select', () => {
    participant.case_role_name = '';
    participant.hearing_role_name = '';

    component.isPartySelected = true;
    component.isRoleSelected = true;
    component.getParticipant(participant);

    expect(component.participantDetails.case_role_name).toBeTruthy();
    expect(component.participantDetails.case_role_name).toEqual(Constants.PleaseSelect);
    expect(component.participantDetails.hearing_role_name).toEqual(Constants.PleaseSelect);
  });
  it('should populate the form fields if the participant is found in data store', () => {
    participant.id = '2345';
    component.isPartySelected = true;
    component.form.get('party').setValue('Claimant');
    component.isRoleSelected = true;
    component.form.get('role').setValue('Solicitor');

    component.getParticipant(participant);
    expect(role.value).toBe(participant.hearing_role_name);
    expect(party.value).toBe(participant.case_role_name);
    expect(firstName.value).toBe(participant.first_name);
    expect(lastName.value).toBe(participant.last_name);
    expect(phone.value).toBe(participant.phone);
    expect(title.value).toBe(participant.title);
    expect(displayName.value).toBe(participant.display_name);
    expect(companyName.value).toBe(participant.company);
    if (constants.IndividualRoles.indexOf(participant.hearing_role_name) > -1) {
      expect(houseNumber.value).toBe(participant.housenumber);
      expect(street.value).toBe(participant.street);
      expect(city.value).toBe(participant.city);
      expect(county.value).toBe(participant.county);
      expect(postcode.value).toBe(participant.postcode);
    }
    expect(component.displayNextButton).toBeFalsy();
    expect(component.displayClearButton).toBeTruthy();
    expect(component.displayAddButton).toBeTruthy();
    expect(component.displayUpdateButton).toBeFalsy();
  });
  it('should clear all fields and reset to initial value', () => {
    component.getParticipant(participant);
    component.clearForm();
    expect(role.value).toBe(Constants.PleaseSelect);
    expect(party.value).toBe(Constants.PleaseSelect);
    expect(firstName.value).toBe('');
    expect(lastName.value).toBe('');
    expect(phone.value).toBe('');
    expect(title.value).toBe(Constants.PleaseSelect);
    expect(displayName.value).toBe('');
    expect(companyName.value).toBe('');
    expect(role.untouched).toBeTruthy();
    expect(party.untouched).toBeTruthy();
    expect(firstName.untouched).toBeTruthy();
  });
  it('should display next button and hide add button after clear all fields', () => {
    component.getParticipant(participant);
    component.clearForm();
    expect(component.displayNextButton).toBeTruthy();
    expect(component.displayAddButton).toBeFalsy();
    expect(component.displayClearButton).toBeFalsy();
  });
  it('saved participant added to list of participants', () => {
    component.showDetails = true;
    spyOn(component.searchEmail, 'validateEmail').and.returnValue(true);
    component.searchEmail.email = 'mock@email.com';
    role.setValue('Claimant LIP');
    party.setValue('Claimant');
    firstName.setValue('Sam');
    lastName.setValue('Green');
    title.setValue('Mrs');
    phone.setValue('12345');
    displayName.setValue('Sam Green');
    companyName.setValue('CC');

    component.isRoleSelected = true;
    component.showAddress = true;
    houseNumber.setValue('12');
    street.setValue('Test Street');
    city.setValue('Test City');
    county.setValue('Test County');
    postcode.setValue('TE1 5NR');
    component.isPartySelected = true;

    component.saveParticipant();

    expect(component.isShowErrorSummary).toBeFalsy();
    expect(component.hearing.participants.length).toBeGreaterThan(0);
  });
  it('saved participant with invalid details should show error summary', () => {
    component.isRoleSelected = false;
    component.isPartySelected = false;
    component.saveParticipant();
    expect(component.isShowErrorSummary).toBeTruthy();
  });
  it('should see next button and hide add button after saved participant', () => {
    component.showDetails = true;
    spyOn(component.searchEmail, 'validateEmail').and.returnValue(true);
    component.searchEmail.email = 'mock@email.com';
    role.setValue('Appellant');
    party.setValue('CaseRole');
    firstName.setValue('Sam');
    lastName.setValue('Green');
    title.setValue('Mrs');
    phone.setValue('12345');
    displayName.setValue('Sam');
    companyName.setValue('CC');
    component.isRoleSelected = true;
    component.isPartySelected = true;
    component.hearing.participants = [];
    component.saveParticipant();
    expect(component.displayNextButton).toBeTruthy();
    expect(component.displayAddButton).toBeFalsy();
    expect(component.displayClearButton).toBeFalsy();
  });
  it('press button cancel display pop up confirmation dialog', () => {
    component.addParticipantCancel();
    expect(component.showCancelPopup).toBeTruthy();
  });

  it('press button cancel on pop up close pop up confirmation dialog and navigate to dashboard', () => {
    component.handleCancelBooking();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.showCancelPopup).toBeFalsy();
  });

  it('press button continue on pop up close pop up confirmation dialog and return to add participant view', () => {
    component.handleContinueBooking();
    expect(component.showCancelPopup).toBeFalsy();
  });

  it('initially should be visible next button, add and clear buttons are not visible', () => {
    expect(component.displayNextButton).toBeTruthy();
    expect(component.displayAddButton).toBeFalsy();
    expect(component.displayClearButton).toBeFalsy();
  });
  it('if no participants added and pressed Next button then error displayed', () => {
    component.hearing.participants = [];
    component.next();
    expect(component.displayErrorNoParticipants).toBeTruthy();
  });
  it('error that at least one participant should be added is hidden, once email is entering', () => {
    component.hearing.participants = [];
    component.next();
    expect(component.displayErrorNoParticipants).toBeTruthy();
    component.getParticipant(participant);
    expect(component.displayErrorNoParticipants).toBeFalsy();
  });
  it('should navigate to other information page', () => {
    component.hearing.participants = participants;
    component.next();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
  });
  it('the case roles and hearing roles were populated', () => {
    component.setupRoles(roleList);
    expect(component.roleList.length).toBe(2);
    expect(component.roleList[0]).toEqual(Constants.PleaseSelect);

    expect(component.hearingRoleList.length).toBe(3);
    expect(component.hearingRoleList[0]).toEqual(Constants.PleaseSelect);
  });
  it('party selected will reset hearing roles', () => {
    role.setValue('Claimant');
    component.partySelected();
    expect(component.isRoleSelected).toBeTruthy();
    expect(component.hearingRoleList.length).toBe(1);
  });
  it('should not add second time value: Please select to a hearing role list', () => {
    const partyL = new PartyModel('Claimant');
    partyL.hearingRoles = [Constants.PleaseSelect, 'Solicitor'];
    const partyLst: PartyModel[] = [partyL];
    component.caseAndHearingRoles = partyLst;
    role.setValue('Claimant');
    component.setupHearingRoles('Claimant');
    expect(component.hearingRoleList.length).toBe(2);
  });
  it('the hearing role list should be empty if selected party name was not found, ', () => {
    const partyL = new PartyModel('Claimant');
    partyL.hearingRoles = [Constants.PleaseSelect, 'Solicitor'];
    const partyLst: PartyModel[] = [partyL];
    component.caseAndHearingRoles = partyLst;
    component.setupHearingRoles('Defendant');
    expect(component.hearingRoleList.length).toBe(1);
  });
  it('should set to true isTitleSelected', () => {
    title.setValue('Mr');
    component.titleSelected();
    expect(component.isTitleSelected).toBeTruthy();
  });
  it('should set to false isTitleSelected', () => {
    title.setValue(Constants.PleaseSelect);
    component.titleSelected();
    expect(component.isTitleSelected).toBeFalsy();
  });
  it('should show error summary if input data is invalid', () => {
    component.isRoleSelected = false;
    component.saveParticipant();
    expect(component.isShowErrorSummary).toBeTruthy();
  });
  it('if cancel add participant then pop up confirmation dialog', () => {
    component.addParticipantCancel();
    expect(component.showCancelPopup).toBeTruthy();
  });
  it('if pop up confirm to continue, dialog is hidden', () => {
    component.handleContinueBooking();
    expect(component.showCancelPopup).toBeFalsy();
  });
});

describe('AddParticipantComponent edit mode', () => {

  beforeEach(async(() => {
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
      'getCurrentRequest', 'getParticipantRoles', 'setBookingHasChanged', 'updateHearingRequest', 'cancelRequest'
    ]);
    bookingServiceSpy = jasmine.createSpyObj<BookingService>(['isEditMode', 'getParticipantEmail', 'resetEditMode']);

    TestBed.configureTestingModule({
      declarations: [
        AddParticipantComponent,
        BreadcrumbStubComponent,
        SearchEmailComponent,
        ParticipantsListComponent,
        CancelPopupStubComponent,
        ConfirmationPopupStubComponent,
        RemovePopupStubComponent,
        DiscardConfirmPopupComponent,
      ],
      imports: [
        SharedModule,
        RouterModule.forChild([])
      ],
      providers: [
        { provide: SearchService, useClass: SearchServiceStub },
        { provide: Router, useValue: routerSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: ParticipantService, useValue: participantServiceSpy },
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: Logger, useValue: loggerSpy },
      ]
    })
      .compileComponents();

    const hearing = initExistHearingRequest();
    videoHearingsServiceSpy.getParticipantRoles.and.returnValue(Promise.resolve(roleList));
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
    participantServiceSpy.mapParticipantsRoles.and.returnValue(partyList);
    bookingServiceSpy.isEditMode.and.returnValue(true);
    bookingServiceSpy.getParticipantEmail.and.returnValue('test3@test.com');

    fixture = TestBed.createComponent(AddParticipantComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    component.editMode = true;
    component.ngOnInit();
    fixture.detectChanges();

    role = component.form.controls['role'];
    party = component.form.controls['party'];
    title = component.form.controls['title'];
    firstName = component.form.controls['firstName'];
    lastName = component.form.controls['lastName'];
    phone = component.form.controls['phone'];
    displayName = component.form.controls['displayName'];
    companyName = component.form.controls['companyName'];
    companyNameIndividual = component.form.controls['companyNameIndividual'];
    houseNumber = component.form.controls['houseNumber'];
    street = component.form.controls['street'];
    city = component.form.controls['city'];
    county = component.form.controls['county'];
    postcode = component.form.controls['postcode'];
  }));
  it('should initialize form controls', () => {
    component.initializeForm();
    expect(component.form.controls['firstName']).toBeTruthy();
    expect(component.form.controls['firstName'].errors['required']).toBeTruthy();
    expect(component.form.controls['lastName']).toBeTruthy();
    expect(component.form.controls['lastName'].errors['required']).toBeTruthy();
  });
  it('should set title list and get current data from session', () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.titleList).toBeTruthy();
    expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
  });
  it('should initialize edit mode as true and value of button set to save', () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.editMode).toBeTruthy();
    expect(component.buttonAction).toBe('Save');
    expect(bookingServiceSpy.isEditMode).toHaveBeenCalled();
  });
  it('navigate to summary should reset editMode to false', () => {
    component.navigateToSummary();
    fixture.detectChanges();
    expect(component.editMode).toBeFalsy();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
    expect(bookingServiceSpy.resetEditMode).toHaveBeenCalled();
  });

  it('should set edit mode and populate participant data', fakeAsync(() => {
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
      expect(component.hearing).toBeTruthy();
      expect(component.existingParticipant).toBeTruthy();
      expect(videoHearingsServiceSpy.getParticipantRoles).toHaveBeenCalled();
      expect(component.showDetails).toBeTruthy();
      expect(component.selectedParticipantEmail).toBe('test3@test.com');
      expect(component.displayNextButton).toBeTruthy();
      expect(component.displayClearButton).toBeFalsy();
      expect(component.displayAddButton).toBeFalsy();
      expect(component.displayUpdateButton).toBeFalsy();
    });
    fixture.detectChanges();
  }));

  it('should update participant and clear form', () => {
    component.showDetails = true;
    fixture.detectChanges();
    spyOn(component.searchEmail, 'validateEmail').and.returnValue(true);
    component.searchEmail.email = 'test3@test.com';

    role.setValue('Solicitor');
    party.setValue('Claimant');
    firstName.setValue('Sam');
    lastName.setValue('Green');
    title.setValue('Mrs');
    phone.setValue('12345');
    displayName.setValue('Sam');
    companyName.setValue('CC');
    component.isRoleSelected = true;
    component.isPartySelected = true;
    component.updateParticipant();
    const updatedParticipant = component.hearing.participants.find(x => x.email === 'test3@test.com');
    expect(updatedParticipant.display_name).toBe('Sam');
    expect(displayName.value).toBe('');
  });
  it('should before save booking check if all fields available', () => {
    component.actionsBeforeSave();
    expect(component.showDetails).toBeTruthy();
    expect(firstName.touched).toBeTruthy();
    expect(lastName.touched).toBeTruthy();
    expect(phone.touched).toBeTruthy();
    expect(role.touched).toBeTruthy();
  });
  it('if cancel add participant in edit mode then navigate to summary page', () => {
    component.addParticipantCancel();
    fixture.detectChanges();
    expect(bookingServiceSpy.resetEditMode).toHaveBeenCalled();
    expect(component.editMode).toBeFalsy();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('should update participant details and reset edit mode to false if method next is called', () => {
    fixture.detectChanges();
    component.searchEmail.email = participant.email;
    component.form.setValue({
      party: 'Claimant',
      role: 'Solicitor',
      title: 'Ms',
      firstName: participant.first_name,
      lastName: participant.last_name,
      phone: participant.phone,
      displayName: participant.display_name,
      companyName: participant.company,
      companyNameIndividual: participant.company,
      houseNumber: participant.housenumber,
      street: participant.street,
      city: participant.city,
      county: participant.county,
      postcode: participant.postcode,
      solicitorReference: participant.solicitorsReference,
      representing: participant.representee
    });
    component.hearing = initHearingRequest();
    fixture.detectChanges();
    component.next();

    expect(component.showDetails).toBeFalsy();
    expect(component.localEditMode).toBeFalsy();
    expect(bookingServiceSpy.resetEditMode).toHaveBeenCalled();
    expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
  });
  it('should detect that the form is invalid while performing update', () => {
    fixture.detectChanges();
    component.searchEmail.email = participant.email;
    component.form.setValue({
      party: Constants.PleaseSelect,
      role: '',
      title: Constants.PleaseSelect,
      firstName: participant.first_name,
      lastName: participant.last_name,
      phone: participant.phone,
      displayName: participant.display_name,
      companyName: participant.company,
      companyNameIndividual: participant.company,
      houseNumber: participant.housenumber,
      street: participant.street,
      city: participant.city,
      county: participant.county,
      postcode: participant.postcode,
      solicitorReference: participant.solicitorsReference,
      representing: participant.representee
    });
    component.hearing = initHearingRequest();
    fixture.detectChanges();
    component.next();

    expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
    expect(component.showDetails).toBeTruthy();
  });
  it('should check if existing booking has participants', () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
    expect(component.hearing).toBeTruthy();
    expect(component.hearing.hearing_id).toBeTruthy();
    expect(component.bookingHasParticipants).toBeTruthy();
  });

  it('should navigate to summary page if the method cancel called in the edit mode and no changes made', () => {
    component.form.markAsUntouched();
    component.form.markAsPristine();

    fixture.detectChanges();
    component.addParticipantCancel();

    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('press button cancel in edit mode if there are some changes show pop up', () => {
    component.form.markAsDirty();
    component.editMode = false;
    fixture.detectChanges();
    component.addParticipantCancel();
    expect(component.showCancelPopup).toBeTruthy();
  });
  it('should hide cancel and discard pop up confirmation', () => {
    component.handleContinueBooking();
    expect(component.showCancelPopup).toBeFalsy();
    expect(component.attemptingDiscardChanges).toBeFalsy();
  });
  it('should show discard pop up confirmation', () => {
    component.editMode = true;
    component.form.markAsDirty();
    fixture.detectChanges();
    component.addParticipantCancel();
    expect(component.attemptingDiscardChanges).toBeTruthy();
  });
  it('should show cancel booking confirmation pop up', () => {
    component.editMode = false;
    fixture.detectChanges();
    component.addParticipantCancel();
    expect(component.showCancelPopup).toBeTruthy();
  });
  it('should cancel booking, hide pop up and navigate to dashboard', () => {
    component.editMode = false;
    component.handleCancelBooking();
    expect(component.showCancelPopup).toBeFalsy();
    expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('should cancel current changes, hide pop up and navigate to summary', () => {
    component.attemptingDiscardChanges = true;

    fixture.detectChanges();
    component.cancelChanges();
    expect(component.attemptingDiscardChanges).toBeFalsy();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
});

describe('AddParticipantComponent edit mode no participants added', () => {

  beforeEach(async(() => {
    const hearing = initExistHearingRequest();
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
      'getParticipantRoles', 'getCurrentRequest', 'setBookingHasChanged'
    ]);
    videoHearingsServiceSpy.getParticipantRoles.and.returnValue(Promise.resolve(roleList));
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
    participantServiceSpy.mapParticipantsRoles.and.returnValue(partyList);
    bookingServiceSpy = jasmine.createSpyObj<BookingService>(['getParticipantEmail', 'isEditMode', 'setEditMode']);
    bookingServiceSpy.isEditMode.and.returnValue(true);
    bookingServiceSpy.getParticipantEmail.and.returnValue('');

    component = new AddParticipantComponent(
      jasmine.createSpyObj<SearchService>(['search']),
      videoHearingsServiceSpy,
      participantServiceSpy,
      jasmine.createSpyObj<Router>(['navigate']),
      bookingServiceSpy,
      loggerSpy
    );
    component.participantsListComponent = new ParticipantsListComponent(
      bookingServiceSpy,
      jasmine.createSpyObj<Router>(['navigate'])
    );
    component.editMode = true;
    component.ngOnInit();

    role = component.form.controls['role'];
    party = component.form.controls['party'];
    title = component.form.controls['title'];
    firstName = component.form.controls['firstName'];
    lastName = component.form.controls['lastName'];
    phone = component.form.controls['phone'];
    displayName = component.form.controls['displayName'];
    companyName = component.form.controls['companyName'];
  }));
  it('should show button add participant', fakeAsync(() => {
    component.ngAfterContentInit();
    component.ngAfterViewInit();
    tick(600);
    expect(component.editMode).toBeTruthy();
    expect(bookingServiceSpy.getParticipantEmail).toHaveBeenCalled();
    expect(component.selectedParticipantEmail).toBe('');
    expect(component.showDetails).toBeFalsy();
    expect(component.displayNextButton).toBeFalsy();
    expect(component.displayClearButton).toBeTruthy();
    expect(component.displayAddButton).toBeTruthy();
    expect(component.displayUpdateButton).toBeFalsy();
  }));

  it('should recognize a participantList', async(() => {
    component.ngAfterContentInit();
    component.ngAfterViewInit();
    const partList = component.participantsListComponent;
    expect(partList).toBeDefined();
  }));
  it('should show all fields if the participant selected for edit', fakeAsync(() => {
    component.ngAfterContentInit();
    component.ngAfterViewInit();
    tick(600);
    const partList = component.participantsListComponent;
    partList.editParticipant('test2@test.com');
    partList.selectedParticipant.emit();
    tick(600);

    expect(component.showDetails).toBeTruthy();
  }));
  it('should show confirmation to remove participant', fakeAsync(() => {
    component.ngAfterContentInit();
    component.ngAfterViewInit();
    tick(600);
    const partList = component.participantsListComponent;
    partList.removeParticipant('test2@test.com');
    component.selectedParticipantEmail = 'test2@test.com';
    partList.selectedParticipantToRemove.emit();
    tick(600);

    expect(component.showConfirmationRemoveParticipant).toBeTruthy();
  }));
  it('should display add button if participant has no email set', fakeAsync(() => {
    component.ngAfterContentInit();
    component.ngAfterViewInit();
    component.selectedParticipantEmail = '';
    component.ngOnInit();
    tick(600);

    expect(component.showDetails).toBeFalsy();
    expect(component.displayAddButton).toBeTruthy();
  }));
  it('should set existingParticipant to false', () => {
    participant.id = '';
    component.participantDetails = participant;
    component.getParticipant(participant);
    expect(component.existingParticipant).toBeFalsy();
  });
  it('should set existingParticipant to true', () => {
    participant.id = '12345';
    component.participantDetails = participant;
    component.getParticipant(participant);
    expect(component.existingParticipant).toBeTruthy();
  });
  it('should reset hearing roles drop down if participant case role changed', () => {
    spyOn(component, 'setupHearingRoles');
    participant.id = undefined;
    participant.case_role_name = 'Claimant';
    component.participantDetails = participant;

    component.resetPartyAndRole();

    expect(component.setupHearingRoles).toHaveBeenCalled();
  });
  it('should set case role value from the input field', () => {
    participant.id = undefined;
    participant.case_role_name = undefined;
    component.isPartySelected = true;
    component.participantDetails = participant;

    component.resetPartyAndRole();
    expect(component.participantDetails.case_role_name).toBeTruthy();
    expect(component.participantDetails.case_role_name).toEqual(Constants.PleaseSelect);
  });
  it('should set hearing role value from the input field', () => {
    participant.id = undefined;
    participant.hearing_role_name = undefined;
    component.isRoleSelected = true;
    component.participantDetails = participant;

    component.resetPartyAndRole();
    expect(component.participantDetails.hearing_role_name).toBeTruthy();
    expect(component.participantDetails.hearing_role_name).toEqual(Constants.PleaseSelect);
  });
  it('should set houseNumber field to invalid', () => {
    component.form.get('houseNumber').setErrors({ 'incorrect': true });
    component.form.get('houseNumber').markAsTouched();
    component.isShowErrorSummary = true;

    expect(component.houseNumberInvalid).toBeTruthy();
  });
  it('should set street field to invalid', () => {
    component.form.get('street').setErrors({ 'incorrect': true });
    component.form.get('street').markAsTouched();
    component.isShowErrorSummary = true;
    expect(component.streetInvalid).toBeTruthy();
  });
  it('should set city field to invalid', () => {
    component.form.get('city').setErrors({ 'incorrect': true });
    component.form.get('city').markAsTouched();
    component.isShowErrorSummary = true;
    expect(component.cityInvalid).toBeTruthy();
  });
  it('should set county field to invalid', () => {
    component.form.get('county').setErrors({ 'incorrect': true });
    component.form.get('county').markAsTouched();

    component.isShowErrorSummary = true;
    expect(component.countyInvalid).toBeTruthy();
  });
  it('should set postcode field to invalid', () => {
    component.form.get('postcode').setErrors({ 'incorrect': true });
    component.form.get('postcode').markAsTouched();
    component.isShowErrorSummary = true;
    expect(component.postcodeInvalid).toBeTruthy();
  });
  it('should disable first and last names fields if the person exist in data store', () => {
    participant.is_exist_person = true;
    component.participantDetails = participant;
    component.getParticipant(participant);

    expect(component.form.get('firstName').disabled).toBeTruthy();
    expect(component.form.get('lastName').disabled).toBeTruthy();
  });
});
describe('AddParticipantComponent set representer', () => {

  beforeEach(async(() => {
    const hearing = initExistHearingRequest();
    videoHearingsServiceSpy.getParticipantRoles.and.returnValue(Promise.resolve(roleList));
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
    participantServiceSpy.mapParticipantsRoles.and.returnValue(partyList);
    bookingServiceSpy.isEditMode.and.returnValue(true);
    bookingServiceSpy.getParticipantEmail.and.returnValue('');
    const searchServiceStab = jasmine.createSpyObj<SearchService>(['search']);

    component = new AddParticipantComponent(
      searchServiceStab,
      videoHearingsServiceSpy,
      participantServiceSpy,
      { ...routerSpy, ...jasmine.createSpyObj<Router>(['navigate']) } as jasmine.SpyObj<Router>,
      bookingServiceSpy,
      loggerSpy
    );
    component.ngOnInit();

    role = component.form.controls['role'];
    party = component.form.controls['party'];
    title = component.form.controls['title'];
    firstName = component.form.controls['firstName'];
    lastName = component.form.controls['lastName'];
    phone = component.form.controls['phone'];
    displayName = component.form.controls['displayName'];
    companyName = component.form.controls['companyName'];
    solicitorReference = component.form.controls['solicitorReference'];
    representing = component.form.controls['representing'];
  }));

  it('should show solicitor reference, company and name of representing person', () => {
    component.form.get('role').setValue('Solicitor');

    component.roleSelected();

    expect(component.isSolicitor).toBeTruthy();
  });
  it('should clean the fields solicitor reference, company and name of representing person', () => {
    component.form.get('role').setValue('Solicitor');
    component.roleSelected();

    component.form.get('companyName').setValue('Organisation');
    component.form.get('solicitorReference').setValue('Ref1');
    component.form.get('representing').setValue('Ms X');

    component.form.get('role').setValue('Claimant');
    component.roleSelected();

    expect(component.isSolicitor).toBeFalsy();
    expect(component.form.get('companyName').value).toEqual('');
    expect(component.form.get('solicitorReference').value).toEqual('');
    expect(component.form.get('representing').value).toEqual('');
  });
  it('should set email of existing participant after initialize content of the component', () => {
    component.editMode = true;
    component.searchEmail = new SearchEmailComponent(jasmine.createSpyObj<SearchService>(['search']));
    component.participantDetails = participants[0];
    component.ngAfterContentInit();
    expect(component.searchEmail.email).toBeTruthy();
  });
});

function isAddressControlValid(control: AbstractControl, controlValue: string) {
  party.setValue('Claimant');
  role.setValue('Claimant LIP');
  component.showAddress = true;
  control.setValidators([Validators.required]);
  control.updateValueAndValidity();
  control.setValue(controlValue);
  expect(control.valid).toBeTruthy();
}
