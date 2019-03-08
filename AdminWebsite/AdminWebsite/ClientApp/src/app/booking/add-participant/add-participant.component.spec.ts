import { DebugElement, Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { CancelPopupStubComponent } from 'src/app/testing/stubs/cancel-popup-stub';
import { ConfirmationPopupStubComponent } from 'src/app/testing/stubs/confirmation-popup-stub';
import { ParticipantsListStubComponent } from 'src/app/testing/stubs/participant-list-stub';
import { RemovePopupStubComponent } from '../../testing/stubs/remove-popup-stub';

import { SearchServiceStub } from 'src/app/testing/stubs/serice-service-stub';
import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { ParticipantService } from '../services/participant.service';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { AddParticipantComponent } from './add-participant.component';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { CaseAndHearingRolesResponse } from '../../services/clients/api-client';

let component: AddParticipantComponent;
let fixture: ComponentFixture<AddParticipantComponent>;

const roleList: CaseAndHearingRolesResponse[] = [new CaseAndHearingRolesResponse({ name: 'Claimant', hearing_roles: ['Solicitor']})];

let role: AbstractControl;
let party: AbstractControl;
let title: AbstractControl;
let firstName: AbstractControl;
let lastName: AbstractControl;
let phone: AbstractControl;
let displayName: AbstractControl;

const participants: ParticipantModel[] = [];

const p1 = new ParticipantModel();
p1.first_name = 'John';
p1.last_name = 'Doe';
p1.display_name = 'John Doe';
p1.is_judge = true;
p1.title = 'Mr.';
p1.email = 'test@test.com';
p1.phone = '32332';
p1.hearing_role_name = 'Solicitor';
p1.case_role_name = 'Claimant';

const p2 = new ParticipantModel();
p2.first_name = 'Jane';
p2.last_name = 'Doe';
p2.display_name = 'Jane Doe';
p2.is_judge = true;
p2.title = 'Mr.';
p2.email = 'test@test.com';
p2.phone = '32332';
p2.hearing_role_name = 'Solicitor';
p2.case_role_name = 'Claimant';


const p3 = new ParticipantModel();
p3.first_name = 'Chris';
p3.last_name = 'Green';
p3.display_name = 'Chris Green';
p3.is_judge = true;
p3.title = 'Mr.';
p3.email = 'test@test.com';
p3.phone = '32332';
p3.hearing_role_name = 'Solicitor';
p3.case_role_name = 'Claimant';

participants.push(p1);
participants.push(p2);
participants.push(p3);


function initHearingRequest(): HearingModel {
  const newHearing = new HearingModel();
  newHearing.cases = [];
  newHearing.hearing_type_id = -1;
  newHearing.hearing_venue_id = -1
  newHearing.scheduled_duration = 0;
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


const routerSpy = {
  navigate: jasmine.createSpy('navigate'),
  events: of(new NavigationEnd(2, '/', '/'))
};

let debugElement: DebugElement;
let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let participantServiceSpy: jasmine.SpyObj<ParticipantService>;

describe('AddParticipantComponent', () => {

  videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService',
    ['getParticipantRoles', 'getCurrentRequest', 'updateHearingRequest']);
  participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService',
    ['checkDuplication', 'getAllParticipants', 'removeParticipant']);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddParticipantComponent,
        BreadcrumbStubComponent,
        SearchEmailComponent,
        ParticipantsListStubComponent,
        CancelPopupStubComponent,
        ConfirmationPopupStubComponent,
        RemovePopupStubComponent
      ],
      imports: [
        SharedModule
      ],
      providers: [
        { provide: SearchService, useClass: SearchServiceStub },
        { provide: Router, useValue: routerSpy },
        { provide: VideoHearingsService, useValue: videoHearingsServiceSpy }
      ]
    })
      .compileComponents();

    const hearing = initHearingRequest();
    videoHearingsServiceSpy.getParticipantRoles.and.returnValue(of(roleList));
    videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
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
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should set case role list, hearing role list and title list', () => {
    component.ngOnInit();
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
  it('should set values fields if participant is found', () => {
    component.getParticipant(participant);
    expect(role.value).toBe(participant.hearing_role_name);
    expect(party.value).toBe(participant.case_role_name);
    expect(firstName.value).toBe(participant.first_name);
    expect(lastName.value).toBe(participant.last_name);
    expect(phone.value).toBe(participant.phone);
    expect(title.value).toBe(participant.title);
    expect(displayName.value).toBe(participant.display_name);
  });
  it('should clear all fields and reset to initial value', () => {
    component.getParticipant(participant);
    component.clearForm();
    expect(role.value).toBe('Please Select');
    expect(firstName.value).toBe('');
    expect(lastName.value).toBe('');
    expect(phone.value).toBe('');
    expect(title.value).toBe('Please Select');
    expect(displayName.value).toBe('');
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
    component.handleCancelBooking('string');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.showCancelPopup).toBeFalsy();
  });

  it('press button continue on pop up close pop up confirmation dialog and return to add participant view', () => {
    component.handleContinueBooking('string');
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

});

