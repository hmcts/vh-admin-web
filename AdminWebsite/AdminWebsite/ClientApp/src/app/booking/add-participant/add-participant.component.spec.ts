import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { AbstractControl, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { CancelPopupStubComponent } from 'src/app/testing/stubs/cancel-popup-stub';
import { ConfirmationPopupStubComponent } from 'src/app/testing/stubs/confirmation-popup-stub';
import { SearchServiceStub } from 'src/app/testing/stubs/service-service-stub';
import { Constants } from '../../common/constants';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { PartyModel } from '../../common/model/party.model';
import { DiscardConfirmPopupComponent } from '../../popups/discard-confirm-popup/discard-confirm-popup.component';
import { BookingService } from '../../services/booking.service';
import { CaseAndHearingRolesResponse, ClientSettingsResponse, HearingRole } from '../../services/clients/api-client';
import { ConfigService } from '../../services/config.service';
import { Logger } from '../../services/logger';
import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { RemovePopupStubComponent } from '../../testing/stubs/remove-popup-stub';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { ParticipantService } from '../services/participant.service';
import { AddParticipantComponent } from './add-participant.component';
import { HearingRoleModel } from '../../common/model/hearing-role.model';

let component: AddParticipantComponent;
let fixture: ComponentFixture<AddParticipantComponent>;

const roleList: CaseAndHearingRolesResponse[] = [
    new CaseAndHearingRolesResponse({
        name: 'Applicant',
        hearing_roles: [
            new HearingRole({ name: 'Representative', user_role: 'Representative' }),
            new HearingRole({ name: 'Litigant in person', user_role: 'Individual' }),
            new HearingRole({ name: 'presenting officer', user_role: 'Representative' })
        ]
    })
];

const partyR = new PartyModel('Applicant');
partyR.hearingRoles = [
    new HearingRoleModel('Representative', 'Representative'),
    new HearingRoleModel('Litigant in person', 'Individual'),
    new HearingRoleModel('presenting officer', 'Representative')
];
const partyList: PartyModel[] = [partyR];

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

const participants: ParticipantModel[] = [];

const p1 = new ParticipantModel();
p1.first_name = 'John';
p1.last_name = 'Doe';
p1.display_name = 'John Doe';
p1.is_judge = true;
p1.title = 'Mr.';
p1.email = 'test1@hmcts.net';
p1.phone = '32332';
p1.hearing_role_name = 'Representative';
p1.case_role_name = 'Applicant';
p1.company = 'CN';
p1.representee = 'representee';

const p2 = new ParticipantModel();
p2.first_name = 'Jane';
p2.last_name = 'Doe';
p2.display_name = 'Jane Doe';
p2.is_judge = true;
p2.title = 'Mr.';
p2.email = 'test2@hmcts.net';
p2.phone = '32332';
p2.hearing_role_name = 'Representative';
p2.case_role_name = 'Applicant';
p2.company = 'CN';
p2.representee = 'representee';

const p3 = new ParticipantModel();
p3.first_name = 'Chris';
p3.last_name = 'Green';
p3.display_name = 'Chris Green';
p3.is_judge = false;
p3.title = 'Mr.';
p3.email = 'test3@hmcts.net';
p3.phone = '32332';
p3.hearing_role_name = 'Representative';
p3.case_role_name = 'Applicant';
p3.company = 'CN';

p3.id = '1234';
p3.representee = 'representee';

const p4 = new ParticipantModel();
p4.first_name = 'Test';
p4.last_name = 'Participant';
p4.display_name = 'Test Participant';
p4.is_judge = false;
p4.title = 'Mr.';
p4.email = 'test4@hmcts.net';
p4.phone = '32332';
p4.hearing_role_name = 'Litigant in person';
p4.case_role_name = 'Applicant';
p4.company = 'CN';
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
participant.email = 'email@hmcts.net';
participant.first_name = 'Sam';
participant.last_name = 'Green';
participant.phone = '12345';
participant.is_judge = false;
participant.display_name = 'Sam Green';
participant.title = 'Mr';
participant.hearing_role_name = 'Representative';
participant.case_role_name = 'Applicant';
participant.company = 'CN';
participant.representee = 'test representee';

const routerSpy: jasmine.SpyObj<Router> = {
    events: of(new NavigationEnd(2, '/', '/')),
    ...jasmine.createSpyObj<Router>(['navigate'])
} as jasmine.SpyObj<Router>;

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
let bookingServiceSpy: jasmine.SpyObj<BookingService>;
let loggerSpy: jasmine.SpyObj<Logger>;

const configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);

loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService', [
    'checkDuplication',
    'removeParticipant',
    'mapParticipantsRoles'
]);

describe('AddParticipantComponent', () => {
    beforeEach(
        waitForAsync(() => {
            const hearing = initHearingRequest();
            videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
                'getParticipantRoles',
                'getCurrentRequest',
                'setBookingHasChanged',
                'updateHearingRequest',
                'cancelRequest'
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

            component.searchEmail = new SearchEmailComponent(searchService, configServiceSpy, loggerSpy);
            component.participantsListComponent = new ParticipantsListComponent(bookingServiceSpy, routerSpy, loggerSpy);

            component.ngOnInit();

            role = component.form.controls['role'];
            party = component.form.controls['party'];
            title = component.form.controls['title'];
            firstName = component.form.controls['firstName'];
            lastName = component.form.controls['lastName'];
            phone = component.form.controls['phone'];
            displayName = component.form.controls['displayName'];
            companyName = component.form.controls['companyName'];
            representing = component.form.controls['representing'];
        })
    );

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
        component.searchEmail.email = 'valid@hmcts.net';
        expect(component.validEmail()).toBe(true);
    });

    it('has invalid email if email format is wrong', () => {
        component.showDetails = true;
        component.searchEmail.email = 'validhmcts.net';
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

        firstName.setValue('María Jose Carreño Quiñones');
        expect(firstName.valid).toBeFalsy();
    });
    it('should validate last name', () => {
        expect(lastName.valid).toBeFalsy();
        lastName.setValue('Sam');
        expect(lastName.valid).toBeTruthy();

        lastName.setValue('María Jose Carreño Quiñones');
        expect(lastName.valid).toBeFalsy();
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
        component.form.get('party').setValue('Applicant');
        component.isRoleSelected = true;
        component.form.get('role').setValue('Representative');

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
        component.searchEmail.email = 'mock@hmcts.net';
        role.setValue('Litigant in person');
        party.setValue('Applicant');
        firstName.setValue('Sam');
        lastName.setValue('Green');
        title.setValue('Mrs');
        phone.setValue('12345');
        displayName.setValue('Sam Green');
        companyName.setValue('CC');

        component.isRoleSelected = true;
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
        component.searchEmail.email = 'mock@hmcts.net';
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
    it('should navigate to endpoints page', () => {
        component.hearing.participants = participants;
        component.next();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/video-access-points']);
    });
    it('the case roles and hearing roles were populated', () => {
        component.setupRoles(roleList);
        expect(component.roleList.length).toBe(2);
        expect(component.roleList[0]).toEqual(Constants.PleaseSelect);

        console.log(JSON.stringify(component.hearingRoleList));
        expect(component.hearingRoleList.length).toBe(4);
        expect(component.hearingRoleList[0]).toEqual(Constants.PleaseSelect);
    });
    it('party selected will reset hearing roles', () => {
        role.setValue('Applicant');
        component.partySelected();
        expect(component.isRoleSelected).toBeTruthy();
        expect(component.hearingRoleList.length).toBe(1);
    });
    it('should not add second time value: Please select to a hearing role list', () => {
        const roles = new PartyModel('Applicant');
        roles.hearingRoles = [
            new HearingRoleModel(Constants.PleaseSelect, 'None'),
            new HearingRoleModel('Representative', 'Representative')
        ];
        const partyLst: PartyModel[] = [roles];
        component.caseAndHearingRoles = partyLst;
        role.setValue('Applicant');
        component.setupHearingRoles('Applicant');
        expect(component.hearingRoleList.length).toBe(2);
    });
    it('the hearing role list should be empty if selected party name was not found, ', () => {
        const roles = new PartyModel('Applicant');
        roles.hearingRoles = [
            new HearingRoleModel(Constants.PleaseSelect, 'None'),
            new HearingRoleModel('Representative', 'Representative')
        ];
        const partyLst: PartyModel[] = [roles];
        component.caseAndHearingRoles = partyLst;
        component.setupHearingRoles('Respondent');
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
    beforeEach(
        waitForAsync(() => {
            videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
                'getCurrentRequest',
                'getParticipantRoles',
                'setBookingHasChanged',
                'updateHearingRequest',
                'cancelRequest'
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
                    DiscardConfirmPopupComponent
                ],
                imports: [SharedModule, RouterModule.forChild([])],
                providers: [
                    { provide: SearchService, useClass: SearchServiceStub },
                    { provide: Router, useValue: routerSpy },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                    { provide: ParticipantService, useValue: participantServiceSpy },
                    { provide: BookingService, useValue: bookingServiceSpy },
                    { provide: Logger, useValue: loggerSpy },
                    { provide: ConfigService, useValue: configServiceSpy }
                ]
            }).compileComponents();

            const hearing = initExistHearingRequest();
            videoHearingsServiceSpy.getParticipantRoles.and.returnValue(Promise.resolve(roleList));
            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
            participantServiceSpy.mapParticipantsRoles.and.returnValue(partyList);
            bookingServiceSpy.isEditMode.and.returnValue(true);
            bookingServiceSpy.getParticipantEmail.and.returnValue('test3@hmcts.net');
            configServiceSpy.getClientSettings.and.returnValue(of(ClientSettingsResponse));
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
        })
    );
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
            expect(component.selectedParticipantEmail).toBe('test3@hmcts.net');
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
        component.searchEmail.email = 'test3@hmcts.net';

        role.setValue('Representative');
        party.setValue('Applicant');
        firstName.setValue('Sam');
        lastName.setValue('Green');
        title.setValue('Mrs');
        phone.setValue('12345');
        displayName.setValue('Sam');
        companyName.setValue('CC');
        component.isRoleSelected = true;
        component.isPartySelected = true;
        component.updateParticipant();
        const updatedParticipant = component.hearing.participants.find(x => x.email === 'test3@hmcts.net');
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
            party: 'Applicant',
            role: 'Representative',
            title: 'Ms',
            firstName: participant.first_name,
            lastName: participant.last_name,
            phone: participant.phone,
            displayName: participant.display_name,
            companyName: participant.company,
            companyNameIndividual: participant.company,
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
    beforeEach(
        waitForAsync(() => {
            const hearing = initExistHearingRequest();
            videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
                'getParticipantRoles',
                'getCurrentRequest',
                'setBookingHasChanged'
            ]);
            videoHearingsServiceSpy.getParticipantRoles.and.returnValue(Promise.resolve(roleList));
            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
            participantServiceSpy.mapParticipantsRoles.and.returnValue(partyList);
            bookingServiceSpy = jasmine.createSpyObj<BookingService>(['getParticipantEmail', 'isEditMode', 'setEditMode', 'resetEditMode']);
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
                jasmine.createSpyObj<Router>(['navigate']),
                loggerSpy
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
        })
    );
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

    it(
        'should recognize a participantList',
        waitForAsync(() => {
            component.ngAfterContentInit();
            component.ngAfterViewInit();
            const partList = component.participantsListComponent;
            expect(partList).toBeDefined();
        })
    );
    it('should show all fields if the participant selected for edit', fakeAsync(() => {
        component.ngAfterContentInit();
        component.ngAfterViewInit();
        tick(600);
        const partList = component.participantsListComponent;
        partList.editParticipant('test2@hmcts.net');
        partList.selectedParticipant.emit();
        tick(600);

        expect(component.showDetails).toBeTruthy();
    }));
    it('should show confirmation to remove participant', fakeAsync(() => {
        component.ngAfterContentInit();
        component.ngAfterViewInit();
        tick(600);
        const partList = component.participantsListComponent;
        partList.removeParticipant('test2@hmcts.net');
        component.selectedParticipantEmail = 'test2@hmcts.net';
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
        participant.case_role_name = 'Applicant';
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
    it('should disable first and last names fields if the person exist in data store', () => {
        participant.is_exist_person = true;
        component.participantDetails = participant;
        component.getParticipant(participant);

        expect(component.form.get('firstName').disabled).toBeTruthy();
        expect(component.form.get('lastName').disabled).toBeTruthy();
    });
    it('should set values correctly when no participant found', () => {
        participant.is_exist_person = true;
        component.participantDetails = participant;
        component.getParticipant(participant);

        component.notFoundParticipant();
        expect(component.displayErrorNoParticipants).toBeFalsy();
        expect(component.displayNextButton).toBeFalsy();
        expect(component.displayClearButton).toBeTruthy();
        expect(component.displayAddButton).toBeFalsy();
        expect(component.displayUpdateButton).toBeFalsy();
        expect(component.participantDetails).not.toBeNull();
        expect(component.participantDetails.username).toBeNull();
    });
});
describe('AddParticipantComponent set representer', () => {
    beforeEach(
        waitForAsync(() => {
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
            representing = component.form.controls['representing'];
        })
    );

    it('should show company and name of representing person', () => {
        component.caseAndHearingRoles = partyList;
        component.form.get('party').setValue('Applicant');
        component.form.get('role').setValue('Representative');

        component.roleSelected();

        expect(component.isRepresentative).toBeTruthy();
    });
    it('should clean the fields company and name of representing person', () => {
        component.form.get('role').setValue('Representative');
        component.roleSelected();

        component.form.get('companyName').setValue('Organisation');
        component.form.get('representing').setValue('Ms X');

        component.form.get('role').setValue('Applicant');
        component.roleSelected();

        expect(component.isRepresentative).toBeFalsy();
        expect(component.form.get('companyName').value).toEqual('');
        expect(component.form.get('representing').value).toEqual('');
    });
    it('should set email of existing participant after initialize content of the component', () => {
        component.editMode = true;
        component.searchEmail = new SearchEmailComponent(
            jasmine.createSpyObj<SearchService>(['search']),
            configServiceSpy,
            loggerSpy
        );
        component.participantDetails = participants[0];
        component.ngAfterContentInit();
        expect(component.searchEmail.email).toBeTruthy();
    });

    it('should validate companyNameIndividual field and return invalid as it has not permitted characters', () => {
        component.form.controls['companyNameIndividual'].setValue('%');
        component.form.controls['companyNameIndividual'].markAsDirty();

        expect(component.companyIndividualInvalid).toBe(true);
    });
    it('should validate companyNameIndividual field and return valid', () => {
        component.form.controls['companyNameIndividual'].setValue('a');
        expect(component.companyIndividualInvalid).toBe(false);
    });
    it('should sanitize text for first name', () => {
        component.form.controls['firstName'].setValue('<script>text</script>');
        component.firstNameOnBlur();
        expect(component.form.controls['firstName'].value).toBe('text');
    });
    it('should sanitize text for last name', () => {
        component.form.controls['lastName'].setValue('<script>text</script>');
        component.lastNameOnBlur();
        expect(component.form.controls['lastName'].value).toBe('text');
    });
    it('should sanitize text for companyNameIndividual', () => {
        component.form.controls['companyNameIndividual'].setValue('<script>text</script>');
        component.companyNameIndividualOnBlur();
        expect(component.form.controls['companyNameIndividual'].value).toBe('text');
    });
    it('should sanitize text for displayName', () => {
        component.form.controls['displayName'].setValue('<script>text</script>');
        component.displayNameOnBlur();
        expect(component.form.controls['displayName'].value).toBe('text');
    });
    it('should sanitize text for companyName', () => {
        component.form.controls['companyName'].setValue('<script>text</script>');
        component.companyNameOnBlur();
        expect(component.form.controls['companyName'].value).toBe('text');
    });
    it('should sanitize text for representing', () => {
        component.form.controls['representing'].setValue('<script>text</script>');
        component.representingOnBlur();
        expect(component.form.controls['representing'].value).toBe('text');
    });
    it('should unsubscribe all subcriptions on destroy component', () => {
        component.$subscriptions.push(new Subscription(), new Subscription());
        expect(component.$subscriptions[0].closed).toBeFalsy();
        expect(component.$subscriptions[1].closed).toBeFalsy();

        component.ngOnDestroy();

        expect(component.$subscriptions[0].closed).toBeTruthy();
        expect(component.$subscriptions[1].closed).toBeTruthy();
    });
    it('should indicate that role Representative is Representative', () => {
        component.caseAndHearingRoles = partyList;
        const result = component.isRoleRepresentative('Representative', 'Applicant');
        expect(result).toBe(true);
    });
    it('should indicate that role presenting officer is Representative', () => {
        component.caseAndHearingRoles = partyList;
        const result = component.isRoleRepresentative('presenting officer', 'Applicant');
        expect(result).toBe(true);
    });
    it('should indicate that role is not representative', () => {
        component.caseAndHearingRoles = partyList;
        const result = component.isRoleRepresentative('someRole', 'Applicant');
        expect(result).toBe(false);
    });
    it('should not navigate to next page if no participants in the hearing', () => {
        component.hearing.participants = [];
        expect(component.canNavigate).toBe(false);
    });
    it('should navigate to next page if at least one participant in the hearing', () => {
        component.hearing = initHearingRequest();
        expect(component.canNavigate).toBe(true);
    });
});

function isAddressControlValid(control: AbstractControl, controlValue: string) {
    party.setValue('Applicant');
    role.setValue('Litigant in person');
    control.setValidators([Validators.required]);
    control.updateValueAndValidity();
    control.setValue(controlValue);
    expect(control.valid).toBeTruthy();
}
