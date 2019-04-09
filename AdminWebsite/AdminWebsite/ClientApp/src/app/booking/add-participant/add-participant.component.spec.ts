import { DebugElement, Component } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { CancelPopupStubComponent } from 'src/app/testing/stubs/cancel-popup-stub';
import { ConfirmationPopupStubComponent } from 'src/app/testing/stubs/confirmation-popup-stub';
import { ParticipantsListStubComponent } from 'src/app/testing/stubs/participant-list-stub';
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
import { ParticipantsListComponent } from '../participants-list/participants-list.component';

let component: AddParticipantComponent;
let fixture: ComponentFixture<AddParticipantComponent>;

const roleList: CaseAndHearingRolesResponse[] =
  [new CaseAndHearingRolesResponse({ name: 'Claimant', hearing_roles: ['Solicitor'] })];

const partyR = new PartyModel('Claimant');
partyR.hearingRoles = ['Solicitor'];
const partyList: PartyModel[] = [partyR];

let role: AbstractControl;
let party: AbstractControl;
let title: AbstractControl;
let firstName: AbstractControl;
let lastName: AbstractControl;
let phone: AbstractControl;
let displayName: AbstractControl;
let companyName: AbstractControl;

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
p3.id = '1234';

participants.push(p1);
participants.push(p2);
participants.push(p3);


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


const routerSpy = {
  navigate: jasmine.createSpy('navigate'),
  events: of(new NavigationEnd(2, '/', '/'))
};

let debugElement: DebugElement;
let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
let bookingServiceSpy: jasmine.SpyObj<BookingService>;

videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
  ['getParticipantRoles', 'getCurrentRequest', 'updateHearingRequest', 'cancelRequest']);
participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService',
  ['checkDuplication', 'getAllParticipants', 'removeParticipant', 'mapParticipantsRoles']);
bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService',
  ['isEditMode', 'setEditMode', 'resetEditMode', 'setParticipantEmail',
    'getParticipantEmail', 'removeParticipantEmail']);

describe('AddParticipantComponent', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddParticipantComponent,
        BreadcrumbStubComponent,
        SearchEmailComponent,
        ParticipantsListStubComponent,
        CancelPopupStubComponent,
        ConfirmationPopupStubComponent,
        RemovePopupStubComponent,
        DiscardConfirmPopupComponent,
      ],
      imports: [
        SharedModule
      ],
      providers: [
        { provide: SearchService, useClass: SearchServiceStub },
        { provide: Router, useValue: routerSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: ParticipantService, useValue: participantServiceSpy },
        { provide: BookingService, useValue: bookingServiceSpy }
      ]
    })
      .compileComponents();

    const hearing = initHearingRequest();
    videoHearingsServiceSpy.getParticipantRoles.and.returnValue(of(roleList));
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
    participantServiceSpy.mapParticipantsRoles.and.returnValue(partyList);
    bookingServiceSpy.isEditMode.and.returnValue(false);


    fixture = TestBed.createComponent(AddParticipantComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();


    role = component.participantForm.controls['role'];
    party = component.participantForm.controls['party'];
    title = component.participantForm.controls['title'];
    firstName = component.participantForm.controls['firstName'];
    lastName = component.participantForm.controls['lastName'];
    phone = component.participantForm.controls['phone'];
    displayName = component.participantForm.controls['displayName'];
    companyName = component.participantForm.controls['companyName'];
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize edit mode as false and value of button set to next', () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.editMode).toBeFalsy();
    expect(component.buttonAction).toBe('Next');
    expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
  });
  it('should set case role list, hearing role list and title list', () => {
    component.ngOnInit();
    component.ngAfterViewInit();
    expect(component.roleList).toBeTruthy();
    expect(component.roleList.length).toBe(2);
    expect(component.titleList).toBeTruthy();
    expect(component.titleList.length).toBe(2);
  });

  it('should set initial values for fields', () => {
    component.ngOnInit();
    expect(role.value).toBe('Please Select');
    expect(party.value).toBe('Please Select');
    expect(firstName.value).toBe('');
    expect(lastName.value).toBe('');
    expect(phone.value).toBe('');
    expect(title.value).toBe('Please Select');
    expect(companyName.value).toBe('');
  });
  it('should set validation to false when form is empty', () => {
    expect(component.participantForm.valid).toBeFalsy();
  });
  it('should set validation summary be visible if any field is invalid', () => {
    component.showDetails = true;
    fixture.detectChanges();
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
  it('should validate role', () => {
    role.setValue('Please Select');
    component.roleSelected();
    expect(role.valid && component.isRoleSelected).toBeFalsy();
    role.setValue('Appellant');
    component.roleSelected();
    expect(role.valid && component.isRoleSelected).toBeTruthy();
  });
  it('should run getParticipant method and setup hearings roles for a case role', () => {
    spyOn(component, 'setupHearingRoles');
    component.getParticipant(participant);

    expect(component.participantDetails.case_role_name).toBeTruthy();
    expect(component.setupHearingRoles).toHaveBeenCalled();
  });
  it('should title be selected', () => {
    component.participantForm.get('title').setValue('Mr');
    fixture.detectChanges();

    component.titleSelected();

    expect(component.isTitleSelected).toBeTruthy();
  });
  it('should run getParticipant method and reset undefined party and role for new added participant', () => {
    participant.case_role_name = undefined;
    participant.hearing_role_name = undefined;
    component.getParticipant(participant);

    expect(component.participantDetails.case_role_name).toBeTruthy();
    expect(component.participantDetails.case_role_name).toEqual('Please Select');
    expect(component.participantDetails.hearing_role_name).toEqual('Please Select');
  });
  it('should run getParticipant method and reset empty party and role for new added participant', () => {
    participant.case_role_name = '';
    participant.hearing_role_name = '';
    component.isPartySelected = true;
    component.isRoleSelected = true;
    component.getParticipant(participant);

    expect(component.participantDetails.case_role_name).toBeTruthy();
    expect(component.participantDetails.case_role_name).toEqual('Please Select');
    expect(component.participantDetails.hearing_role_name).toEqual('Please Select');
  });
  it('should run getParticipant method and reset empty party and role for new added participant', () => {
    participant.case_role_name = '';
    participant.hearing_role_name = '';
    component.isPartySelected = true;
    component.isRoleSelected = true;
    component.getParticipant(participant);

    expect(component.participantDetails.case_role_name).toBeTruthy();
    expect(component.participantDetails.case_role_name).toEqual('Please Select');
    expect(component.participantDetails.hearing_role_name).toEqual('Please Select');
  });
  it('should set participant details values from existing participant or person data.', () => {
    participant.id = '12345';

    component.getParticipant(participant);

    expect(component.participantDetails).toBeTruthy();
    expect(component.participantDetails.email).toEqual(participant.email);
    expect(component.participantDetails.id).toEqual(participant.id);
  });

  it('should populate the form fields if the participant is found in data store', () => {
    participant.id = '2345';
    component.isPartySelected = true;
    component.participantForm.get('party').setValue('Claimant');
    component.isRoleSelected = true;
    component.participantForm.get('role').setValue('Solicitor');

    fixture.detectChanges();

    component.getParticipant(participant);
    expect(role.value).toBe(participant.hearing_role_name);
    expect(party.value).toBe(participant.case_role_name);
    expect(firstName.value).toBe(participant.first_name);
    expect(lastName.value).toBe(participant.last_name);
    expect(phone.value).toBe(participant.phone);
    expect(title.value).toBe(participant.title);
    expect(displayName.value).toBe(participant.display_name);
    expect(companyName.value).toBe(participant.company);
    expect(component.displayNextButton).toBeFalsy();
    expect(component.displayClearButton).toBeTruthy();
    expect(component.displayAddButton).toBeTruthy();
    expect(component.displayUpdateButton).toBeFalsy();
  });
  it('should clear all fields and reset to initial value', () => {
    component.getParticipant(participant);
    component.clearForm();
    expect(role.value).toBe('Please Select');
    expect(party.value).toBe('Please Select');
    expect(firstName.value).toBe('');
    expect(lastName.value).toBe('');
    expect(phone.value).toBe('');
    expect(title.value).toBe('Please Select');
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
    fixture.detectChanges();
    spyOn(component.searchEmail, 'validateEmail').and.returnValue(true);
    component.searchEmail.email = 'mock@email.com';

    role.setValue('Appellant');
    party.setValue('CaseRole');
    firstName.setValue('Sam');
    lastName.setValue('Green');
    title.setValue('Mrs');
    phone.setValue('12345');
    component.isRoleSelected = true;
    component.isPartySelected = true;
    component.saveParticipant();
    expect(component.isShowErrorSummary).toBeFalsy();
    expect(component.hearing.participants.length).toBeGreaterThan(0);
  });
  it('should see next button and hide add button after saved participant', () => {
    component.showDetails = true;
    fixture.detectChanges();
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
  it('the case roles and hearing roles were populated', () => {
    component.setupRoles(roleList);
    expect(component.roleList.length).toBe(2);
    expect(component.roleList[0]).toEqual('Please Select');

    expect(component.hearingRoleList.length).toBe(2);
    expect(component.hearingRoleList[0]).toEqual('Please Select');
  });
  it('party selected will reset hearing roles', () => {
    role.setValue('Claimant');
    component.partySelected();
    expect(component.isRoleSelected).toBeTruthy();
    expect(component.hearingRoleList.length).toBe(1);
  });
  it('should not add second time value: Please select to a hearing role list', () => {
    const partyL = new PartyModel('Claimant');
    partyL.hearingRoles = ['Please Select', 'Solicitor'];
    const partyLst: PartyModel[] = [partyL];
    component.caseAndHearingRoles = partyLst;
    role.setValue('Claimant');
    component.setupHearingRoles('Claimant');
    expect(component.hearingRoleList.length).toBe(2);
  });
  it('the hearing role list should be empty if selected party name was not found, ', () => {
    const partyL = new PartyModel('Claimant');
    partyL.hearingRoles = ['Please Select', 'Solicitor'];
    const partyLst: PartyModel[] = [partyL];
    component.caseAndHearingRoles = partyLst;
    component.setupHearingRoles('Defendant');
    expect(component.hearingRoleList.length).toBe(1);
  });
  it('should set to true isTitleSelected', () => {
    title.setValue('Mr');
    fixture.detectChanges();
    component.titleSelected();
    expect(component.isTitleSelected).toBeTruthy();
  });
  it('should set to false isTitleSelected', () => {
    title.setValue('Please Select');
    fixture.detectChanges();
    component.titleSelected();
    expect(component.isTitleSelected).toBeFalsy();
  });
  it('should show error summary if input data is invalid', () => {
    component.isRoleSelected = false;
    fixture.detectChanges();
    component.saveParticipant();
    expect(component.showErrorSummary).toBeTruthy();
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
    TestBed.configureTestingModule({
      declarations: [
        AddParticipantComponent,
        BreadcrumbStubComponent,
        SearchEmailComponent,
        ParticipantsListStubComponent,
        CancelPopupStubComponent,
        ConfirmationPopupStubComponent,
        RemovePopupStubComponent,
        DiscardConfirmPopupComponent,
      ],
      imports: [
        SharedModule
      ],
      providers: [
        { provide: SearchService, useClass: SearchServiceStub },
        { provide: Router, useValue: routerSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: ParticipantService, useValue: participantServiceSpy },
        { provide: BookingService, useValue: bookingServiceSpy },
      ]
    })
      .compileComponents();

    const hearing = initExistHearingRequest();
    videoHearingsServiceSpy.getParticipantRoles.and.returnValue(of(roleList));
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
    participantServiceSpy.mapParticipantsRoles.and.returnValue(partyList);
    bookingServiceSpy.isEditMode.and.returnValue(true);
    bookingServiceSpy.getParticipantEmail.and.returnValue('test3@test.com');


    fixture = TestBed.createComponent(AddParticipantComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    component.editMode = true;
    component.ngOnInit();
    fixture.detectChanges();


    role = component.participantForm.controls['role'];
    party = component.participantForm.controls['party'];
    title = component.participantForm.controls['title'];
    firstName = component.participantForm.controls['firstName'];
    lastName = component.participantForm.controls['lastName'];
    phone = component.participantForm.controls['phone'];
    displayName = component.participantForm.controls['displayName'];
    companyName = component.participantForm.controls['companyName'];
  }));
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
      expect(component.isAnyParticipants).toBeTruthy();
      expect(component.isExistingHearing).toBeTruthy();
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
    component.participantForm.setValue({
      party: 'Claimant',
      role: 'Solicitor',
      title: 'Ms',
      firstName: participant.first_name,
      lastName: participant.last_name,
      phone: participant.phone,
      displayName: participant.display_name,
      companyName: participant.company,
    });
    component.next();

    expect(component.showDetails).toBeFalsy();
    expect(component.localEditMode).toBeFalsy();
    expect(bookingServiceSpy.resetEditMode).toHaveBeenCalled();
    expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
  });
  it('should check if the hearing exist', () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
    expect(component.hearing).toBeTruthy();
    expect(component.hearing.hearing_id).toBeTruthy();
    expect(component.isExistingHearing).toBeTruthy();
    expect(component.isAnyParticipants).toBeTruthy();
  });
  it('should navigate to summary page if the method cancel called in the edit mode and no changes made', () => {
    component.participantForm.markAsUntouched();
    component.participantForm.markAsPristine();

    fixture.detectChanges();
    component.addParticipantCancel();

    expect(routerSpy.navigate).toHaveBeenCalled();
  });
  it('press button cancel in edit mode if there are some changes show pop up', () => {
    component.participantForm.markAsDirty();
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
    component.participantForm.markAsDirty();
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
        RouterTestingModule
      ],
      providers: [
        { provide: SearchService, useClass: SearchServiceStub },
        { provide: Router, useValue: routerSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
        { provide: ParticipantService, useValue: participantServiceSpy },
        { provide: BookingService, useValue: bookingServiceSpy },
      ]
    })
      .compileComponents();

    const hearing = initExistHearingRequest();
    videoHearingsServiceSpy.getParticipantRoles.and.returnValue(of(roleList));
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
    participantServiceSpy.mapParticipantsRoles.and.returnValue(partyList);
    bookingServiceSpy.isEditMode.and.returnValue(true);
    bookingServiceSpy.getParticipantEmail.and.returnValue('');


    fixture = TestBed.createComponent(AddParticipantComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    component.editMode = true;
    component.ngOnInit();
    fixture.detectChanges();


    role = component.participantForm.controls['role'];
    party = component.participantForm.controls['party'];
    title = component.participantForm.controls['title'];
    firstName = component.participantForm.controls['firstName'];
    lastName = component.participantForm.controls['lastName'];
    phone = component.participantForm.controls['phone'];
    displayName = component.participantForm.controls['displayName'];
    companyName = component.participantForm.controls['companyName'];
  }));
  it('should show button add participant', () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.editMode).toBeTruthy();
    expect(bookingServiceSpy.getParticipantEmail).toHaveBeenCalled();
    expect(component.selectedParticipantEmail).toBe('');
    expect(component.showDetails).toBeFalsy();
    expect(component.displayNextButton).toBeFalsy();
    expect(component.displayClearButton).toBeTruthy();
    expect(component.displayAddButton).toBeTruthy();
    expect(component.displayUpdateButton).toBeFalsy();
  });
  it('should recognize a participantList', async(() => {
    fixture.detectChanges();
    const partList: ParticipantsListComponent = fixture.componentInstance.participantsListComponent;
    console.log('partList', partList);
    expect(partList).toBeDefined();
  }));
  it('should subscribe for participant list select participant for edit', fakeAsync(() => {
    fixture.detectChanges();
    component.ngOnInit();
    const partList: ParticipantsListComponent = fixture.componentInstance.participantsListComponent;
    partList.editParticipant('test2@test.com');
    partList.selectedParticipant.emit();
    tick(600);
    fixture.detectChanges();
    expect(component.showDetails).toBeFalsy();
  }));
  it('should subscribe for participant list remove participant', fakeAsync(() => {
    fixture.detectChanges();
    component.ngOnInit();
    const partList: ParticipantsListComponent = fixture.componentInstance.participantsListComponent;
    partList.removeParticipant('test2@test.com');
    component.selectedParticipantEmail = 'test2@test.com';
    partList.selectedParticipantToRemove.emit();
    tick(600);
    fixture.detectChanges();
    expect(component.showConfirmationRemoveParticipant).toBeTruthy();
  }));
});
