import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { SearchServiceStub } from 'src/app/testing/stubs/service-service-stub';
import { Constants } from '../../common/constants';
import { BookingService } from '../../services/booking.service';
import { ClientSettingsResponse, HearingRoleResponse } from '../../services/clients/api-client';
import { ConfigService } from '../../services/config.service';
import { Logger } from '../../services/logger';
import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { ParticipantService } from '../services/participant.service';
import { AddParticipantComponent } from './add-participant.component';
import { HearingRoleModel } from '../../common/model/hearing-role.model';
import { ParticipantListComponent } from '../participant';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';
import { BookingModule } from '../booking.module';
import { PopupModule } from 'src/app/popups/popup.module';
import { TestingModule } from 'src/app/testing/testing.module';
import { HearingRoles } from '../../common/model/hearing-roles.model';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { InterpreterFormComponent } from '../interpreter-form/interpreter-form.component';
import { MockComponent } from 'ng-mocks';
import { InterpreterSelectedDto } from '../interpreter-form/interpreter-selected.model';
import { FeatureFlagDirective } from 'src/app/src/app/shared/feature-flag.directive';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';

let component: AddParticipantComponent;
let fixture: ComponentFixture<AddParticipantComponent>;

const flatRoleList: HearingRoleResponse[] = [
    new HearingRoleResponse({
        name: 'Applicant',
        code: 'APPL',
        user_role: 'Individual'
    }),
    new HearingRoleResponse({
        name: 'Interpreter',
        code: 'INTP',
        user_role: 'Individual'
    }),
    new HearingRoleResponse({
        name: 'Judge',
        code: 'JUDG',
        user_role: 'Judge'
    }),
    new HearingRoleResponse({
        name: 'Panel Member',
        code: 'PANL',
        user_role: 'Judicial Office Holder'
    }),
    new HearingRoleResponse({
        name: 'Litigant in person',
        code: 'LIP',
        user_role: 'Individual'
    }),
    new HearingRoleResponse({
        name: 'Representative',
        code: 'RPTT',
        user_role: Constants.HearingRoles.Representative
    }),
    new HearingRoleResponse({
        name: 'Barrister',
        code: 'BARR',
        user_role: Constants.HearingRoles.Representative
    }),
    new HearingRoleResponse({
        name: 'Intermediary',
        code: 'INTE',
        user_role: Constants.HearingRoles.Representative
    })
];

const mappedHearingRoles: HearingRoleModel[] = flatRoleList.map(x => new HearingRoleModel(x.name, x.user_role, x.code));

let role: AbstractControl;
let title: AbstractControl;
let firstName: AbstractControl;
let lastName: AbstractControl;
let email: AbstractControl;
let phone: AbstractControl;
let displayName: AbstractControl;
let companyName: AbstractControl;
let companyNameIndividual: AbstractControl;
let representing: AbstractControl;
let interpretee: AbstractControl;

const participants: VHParticipant[] = [];

const p1 = new VHParticipant();
p1.firstName = 'John';
p1.lastName = 'Doe';
p1.display_Name = 'John Doe';
p1.title = 'Mr.';
p1.email = 'test1@hmcts.net';
p1.phone = '32332';
p1.hearingRoleName = 'Judge';
p1.company = 'CN';

p1.userRoleName = 'Judge';
p1.username = 'judge@user.name';

const p2 = new VHParticipant();
p2.firstName = 'Jane';
p2.lastName = 'Doe';
p2.display_Name = 'Jane Doe';
p2.title = 'Mr.';
p2.email = 'test2@hmcts.net';
p2.phone = '32332';
p2.hearingRoleName = 'Representative';
p2.company = 'CN';
p2.representee = 'representee';
p2.userRoleName = 'Representative';
p1.username = 'judge@user.name';

const p3 = new VHParticipant();
p3.firstName = 'Chris';
p3.lastName = 'Green';
p3.display_Name = 'Chris Green';
p3.title = 'Mr.';
p3.email = 'test3@hmcts.net';
p3.phone = '32332';
p3.hearingRoleName = 'Representative';
p3.company = 'CN';
p3.isExistPerson = true;
p3.id = '1234';
p3.representee = 'representee';
p3.userRoleName = 'Representative';

const p4 = new VHParticipant();
p4.firstName = 'Test';
p4.lastName = 'Participant';
p4.display_Name = 'Test Participant';
p4.title = 'Mr.';
p4.email = 'test4@hmcts.net';
p4.phone = '32332';
p4.hearingRoleName = 'Litigant in person';
p4.company = 'CN';
p4.id = '1234';
p4.userRoleName = 'Individual';

const p5 = new VHParticipant();
p5.firstName = 'Test7';
p5.lastName = 'Participant7';
p5.display_Name = 'Test Participant7';
p5.title = 'Mr.';
p5.email = 'test7@hmcts.net';
p5.phone = '32332';
p5.hearingRoleName = 'Interpreter';
p5.company = 'CN';
p5.id = '1234666';
p5.userRoleName = 'Individual';
p5.interpreterFor = 'test4@hmcts.net';

const p6 = new VHParticipant();
p6.firstName = 'Test8';
p6.lastName = 'Participant8';
p6.display_Name = 'Test Participant8';
p6.title = 'Mr.';
p6.email = 'test8@hmcts.net';
p6.phone = '32332';
p6.hearingRoleName = 'Litigant in Person';
p6.company = 'CN';
p6.id = '1234555';
p6.userRoleName = 'Individual';

participants.push(p1);
participants.push(p2);
participants.push(p3);
participants.push(p4);

function initHearingRequest(): VHBooking {
    const newHearing = new VHBooking();
    newHearing.hearingVenueId = -1;
    newHearing.scheduledDuration = 0;
    newHearing.participants = participants;
    newHearing.caseType = 'Test Service';
    newHearing.caseTypeServiceId = 'AA1';
    return newHearing;
}

function initExistHearingRequest(): VHBooking {
    const newHearing = new VHBooking();
    newHearing.hearingId = '12345';
    newHearing.hearingVenueId = 1;
    newHearing.scheduledDuration = 20;
    newHearing.participants = participants;
    newHearing.participants.push(p5);
    newHearing.participants.push(p6);
    return newHearing;
}

let participant = new VHParticipant();

function initParticipant() {
    participant = new VHParticipant();
    participant.email = 'email@hmcts.net';
    participant.firstName = 'Sam';
    participant.lastName = 'Green';
    participant.phone = '12345';
    participant.display_Name = 'Sam Green';
    participant.title = 'Mr';
    participant.hearingRoleName = 'Representative';
    participant.company = 'CN';
    participant.representee = 'test representee';
    participant.userRoleName = 'Individual';
}

const routerSpy: jasmine.SpyObj<Router> = {
    events: of(new NavigationEnd(2, '/', '/')),
    url: 'assign-judge',
    ...jasmine.createSpyObj<Router>(['navigate'])
} as jasmine.SpyObj<Router>;

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
    'getCurrentRequest',
    'setBookingHasChanged',
    'unsetBookingHasChanged',
    'updateHearingRequest',
    'cancelRequest',
    'isConferenceClosed',
    'isHearingAboutToStart',
    'getHearingRoles'
]);
let bookingServiceSpy: jasmine.SpyObj<BookingService>;
let searchServiceSpy: jasmine.SpyObj<SearchService>;
let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;

const configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);

launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
let participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService', [
    'checkDuplication',
    'removeParticipant',
    'mapParticipantHearingRoles'
]);

const searchService = {
    ...new SearchServiceStub(),
    ...jasmine.createSpyObj<SearchService>(['participantSearch'])
} as jasmine.SpyObj<SearchService>;

describe('AddParticipantComponent', () => {
    beforeEach(waitForAsync(() => {
        initParticipant();

        const hearing = initHearingRequest();
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
        videoHearingsServiceSpy.getHearingRoles.and.returnValue(Promise.resolve(flatRoleList));
        participantServiceSpy = jasmine.createSpyObj<ParticipantService>([
            'checkDuplication',
            'removeParticipant',
            'mapParticipantHearingRoles'
        ]);
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.specialMeasures).and.returnValue(of(false));
        participantServiceSpy.mapParticipantHearingRoles.and.returnValue(mappedHearingRoles);
        bookingServiceSpy = jasmine.createSpyObj<BookingService>(['isEditMode', 'resetEditMode']);
        bookingServiceSpy.isEditMode.and.returnValue(false);

        searchServiceSpy = jasmine.createSpyObj<SearchService>(['participantSearch', 'searchEntries']);

        searchServiceSpy.TitleList = [
            {
                value: 'Mrs'
            },
            {
                value: 'Miss'
            }
        ];

        component = new AddParticipantComponent(
            searchServiceSpy,
            videoHearingsServiceSpy,
            participantServiceSpy,
            routerSpy,
            bookingServiceSpy,
            launchDarklyServiceSpy,
            loggerSpy
        );

        component.searchEmail = new SearchEmailComponent(searchService, configServiceSpy, loggerSpy);
        component.participantsListComponent = new ParticipantListComponent(videoHearingsServiceSpy, launchDarklyServiceSpy);

        component.ngOnInit();

        role = component.form.controls['role'];
        title = component.form.controls['title'];
        firstName = component.form.controls['firstName'];
        lastName = component.form.controls['lastName'];
        email = component.form.controls['email'];
        phone = component.form.controls['phone'];
        displayName = component.form.controls['displayName'];
        companyName = component.form.controls['companyName'];
        representing = component.form.controls['representing'];
        interpretee = component.form.controls['interpreterFor'];
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
        tick(1000);
        expect(component.roleList).toBeTruthy();
        expect(component.roleList.length).toBe(7);
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
        expect(firstName.value).toBe('');
        expect(lastName.value).toBe('');
        expect(email.value).toBe('');
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
        phone.setValue('ABC');
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
    it('should populate the form fields if the participant is found in data store', () => {
        participant.id = '2345';
        component.isPartySelected = true;
        component.isRoleSelected = true;
        component.form.get('role').setValue('Representative');

        const originalFirstName = participant.firstName;
        const originalLastName = participant.lastName;
        participant.firstName = participant.firstName + ' ';
        participant.lastName = participant.lastName + ' ';
        component.getParticipant(participant);
        expect(role.value).toBe(participant.hearingRoleName);
        expect(firstName.value).toBe(originalFirstName);
        expect(lastName.value).toBe(originalLastName);
        expect(email.value).toBe(participant.email);
        expect(phone.value).toBe(participant.phone);
        expect(title.value).toBe(participant.title);
        expect(displayName.value).toBe(participant.display_Name);
        expect(companyName.value).toBe(participant.company);
        expect(component.displayNextButton).toBeFalsy();
        expect(component.displayClearButton).toBeTruthy();
        expect(component.displayAddButton).toBeTruthy();
        expect(component.displayUpdateButton).toBeFalsy();
    });
    it('should populate the form fields when values are null', () => {
        participant.email = null;
        participant.phone = null;
        participant.display_Name = null;
        participant.company = null;
        participant.representee = null;
        component.getParticipant(participant);
        expect(email.value).toBe('');
        expect(phone.value).toBe('');
        expect(displayName.value).toBe('');
        expect(companyName.value).toBe('');
        expect(representing.value).toBe('');
    });
    it('should clear all fields and reset to initial value', () => {
        component.getParticipant(participant);
        component.clearForm();
        expect(role.value).toBe(Constants.PleaseSelect);
        expect(firstName.value).toBe('');
        expect(lastName.value).toBe('');
        expect(email.value).toBe('');
        expect(phone.value).toBe('');
        expect(title.value).toBe(Constants.PleaseSelect);
        expect(displayName.value).toBe('');
        expect(companyName.value).toBe('');
        expect(role.untouched).toBeTruthy();
        expect(firstName.untouched).toBeTruthy();
        expect(interpretee.value).toBe(Constants.PleaseSelect);
    });
    it('should display next button and hide add button after clear all fields', () => {
        component.getParticipant(participant);
        component.clearForm();
        expect(component.displayNextButton).toBeTruthy();
        expect(component.displayAddButton).toBeFalsy();
        expect(component.displayClearButton).toBeFalsy();
    });

    it('saved participant with invalid details should show error summary', () => {
        component.isRoleSelected = false;
        component.isPartySelected = false;
        component.saveParticipant();
        expect(component.isShowErrorSummary).toBeTruthy();
    });

    describe('Valid participant', () => {
        beforeEach(() => {
            component.showDetails = true;
            spyOn(component.searchEmail, 'validateEmail').and.returnValue(true);
            component.searchEmail.initialValue = 'mockInitialValue@hmcts.net';
            component.searchEmail.email = 'mock@hmcts.net';
            role.setValue('Litigant in person');
            firstName.setValue('Sam');
            lastName.setValue('Green');
            email.setValue('Sam.Green@litigant.com');
            title.setValue('Mrs');
            phone.setValue('12345');
            displayName.setValue('Sam Green');
            companyName.setValue('CC');
            component.isRoleSelected = true;
            component.isPartySelected = true;

            component.participantDetails = participant;
        });
        it('saved participant added to list of participants', () => {
            component.saveParticipant();
            expect(component.isShowErrorSummary).toBeFalsy();
            expect(component.hearing.participants.length).toBeGreaterThan(0);
        });
        it('should see next button and hide add button after saved participant', () => {
            component.hearing.participants = [];
            component.saveParticipant();
            expect(component.displayNextButton).toBeTruthy();
            expect(component.displayAddButton).toBeFalsy();
            expect(component.displayClearButton).toBeFalsy();
        });
        it('should set addedDuringHearing to true if participant added while hearing open and is about to start', () => {
            component.hearing.participants = [];
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
            videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
            component.saveParticipant();
            const addedParticipant = component.hearing.participants[0];
            expect(addedParticipant.addedDuringHearing).toBe(true);
        });
        it('should set addedDuringHearing to false if participant added while hearing open and is not about to start', () => {
            component.hearing.participants = [];
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
            videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
            component.saveParticipant();
            const addedParticipant = component.hearing.participants[0];
            expect(addedParticipant.addedDuringHearing).toBe(false);
        });
        it('should set addedDuringHearing to false if participant added while hearing closed and is not about to start', () => {
            component.hearing.participants = [];
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
            videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
            component.saveParticipant();
            const addedParticipant = component.hearing.participants[0];
            expect(addedParticipant.addedDuringHearing).toBe(false);
        });
        it('should set addedDuringHearing to false if participant added while hearing closed and is about to start', () => {
            component.hearing.participants = [];
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
            videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
            component.saveParticipant();
            const addedParticipant = component.hearing.participants[0];
            expect(addedParticipant.addedDuringHearing).toBe(false);
        });
        it('should add interpreter to role list after saving with reference data flag on', fakeAsync(async () => {
            component.hearing.participants = [];
            component.ngAfterViewInit();
            tick(1000);
            component.saveParticipant();
            expect(component.hearingRoleList).toContain('Interpreter');
            flush();
        }));
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

    it('should not show observers in the interpretee list', fakeAsync(() => {
        component.ngOnInit();
        component.ngAfterViewInit();
        tick(1000);
        const observer01 = new VHParticipant();
        observer01.id = 'Observer Observer';
        observer01.firstName = 'firstName';
        observer01.lastName = 'lastName';
        observer01.hearingRoleName = 'Observer';
        observer01.userRoleName = 'Individual';
        component.hearing.participants.push(observer01);
        const observer03 = new VHParticipant();
        observer03.id = 'Vets UK Observer';
        observer03.firstName = 'firstName';
        observer03.lastName = 'lastName';
        observer03.hearingRoleName = 'Observer';
        observer03.userRoleName = 'Individual';
        component.hearing.participants.push(observer03);
        const observer04 = new VHParticipant();
        observer04.id = 'None Observer';
        observer04.firstName = 'firstName';
        observer04.lastName = 'lastName';
        observer04.hearingRoleName = 'Observer';
        observer04.userRoleName = 'Individual';
        component.hearing.participants.push(observer04);
        component.populateInterpretedForList();
        expect(component.interpreteeList.find(i => i.id === observer01.id)).toBeUndefined();
        expect(component.interpreteeList.find(i => i.id === observer03.id)).toBeUndefined();
        expect(component.interpreteeList.find(i => i.id === observer04.id)).toBeUndefined();
    }));
    it('should validate the interpreter drop down', () => {
        component.ngOnInit();
        component.ngAfterViewInit();
        expect(interpretee.valid).toBeFalsy();
        interpretee.setValue('test4@test.com');
        expect(interpretee.valid).toBeTruthy();
        interpretee.setValue('Please select');
        expect(interpretee.valid).toBeFalsy();
    });
    it('should turn off the interpreter validations if the hearing role is not interpreter', () => {
        component.ngOnInit();
        component.ngAfterViewInit();
        component.form.get('role').setValue('Interpreter');
        component.roleSelected();
        component.form.get('interpreterFor').setValue('abc@email.com');
        component.form.get('role').setValue('Claimant');
        component.roleSelected();
        expect(component.isRepresentative).toBeFalsy();
        expect(component.form.get('interpreterFor').value).toEqual(Constants.PleaseSelect);
    });
    it('should clear the linked participant model if interpreter is removed', () => {
        component.hearing.participants = [];
        component.ngOnInit();

        const pa1 = new VHParticipant();
        pa1.firstName = 'firstname';
        pa1.lastName = 'lastname-interpretee';
        pa1.display_Name = 'firstname lastname-interpretee';
        pa1.email = 'firstname.lastname-interpretee@email.com';
        pa1.hearingRoleName = 'Litigant in Person';

        const pa2 = new VHParticipant();
        pa2.firstName = 'firstname';
        pa2.lastName = 'lastname-interpreter';
        pa1.display_Name = 'firstname lastname-interpreter';
        pa2.email = 'firstname.lastname-interpreter@email.com';
        pa2.hearingRoleName = 'Interpreter';
        pa2.interpreterFor = 'firstname.lastname-interpretee@email.com';
        component.hearing.participants.push(pa1);
        component.hearing.participants.push(pa2);

        const linkedParticipants: LinkedParticipantModel[] = [];
        const lp = new LinkedParticipantModel();
        lp.participantEmail = 'firstname.lastname-interpreter@email.com';
        lp.linkedParticipantEmail = 'firstname.lastname-interpretee@email.com';
        linkedParticipants.push(lp);
        component.hearing.linkedOarticipants = linkedParticipants;
        component.selectedParticipantEmail = 'firstname.lastname-interpreter@email.com';
        component.handleContinueRemoveInterpreter();
        expect(component.hearing.linkedOarticipants.length).toBe(0);
        expect(participantServiceSpy.removeParticipant).toHaveBeenCalled();
    });
    it('should clear the linked participant model if interpretee is removed', () => {
        component.hearing.participants = [];
        component.ngOnInit();

        const part1 = new VHParticipant();
        part1.firstName = 'firstname';
        part1.lastName = 'lastname-interpretee';
        part1.display_Name = 'firstname lastname-interpretee';
        part1.email = 'firstname.lastname-interpretee@email.com';
        part1.hearingRoleName = 'Litigant in Person';

        const part2 = new VHParticipant();
        part2.firstName = 'firstname';
        part2.lastName = 'lastname-interpreter';
        part2.display_Name = 'firstname lastname-interpreter';
        part2.email = 'firstname.lastname-interpreter@email.com';
        part2.hearingRoleName = 'Interpreter';
        part2.interpreterFor = 'firstname.lastname-interpretee@email.com';
        component.hearing.participants.push(part1);
        component.hearing.participants.push(part2);

        const linkedParticipants: LinkedParticipantModel[] = [];
        const lp = new LinkedParticipantModel();
        lp.participantEmail = 'firstname.lastname-interpreter@email.com';
        lp.linkedParticipantEmail = 'firstname.lastname-interpretee@email.com';
        linkedParticipants.push(lp);
        component.hearing.linkedOarticipants = linkedParticipants;
        component.selectedParticipantEmail = 'firstname.lastname-interpretee@email.com';
        component.handleContinueRemoveInterpreter();
        expect(component.hearing.linkedOarticipants.length).toBe(0);
        expect(participantServiceSpy.removeParticipant).toHaveBeenCalled();
    });
    it('should call the update hearing service on udpdate click', () => {
        component.updateParticipantAction();
        expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
        expect(component.interpreterSelected).toBe(false);
    });

    describe('validateJudgeAndJohMembers', () => {
        it('should return true if hearing is null', () => {
            component.hearing = null;
            expect(component.validateJudgeAndJohMembers()).toBeTruthy();
        });
        describe('when hearing is not null', () => {
            beforeEach(waitForAsync(() => {
                component.hearing.participants = [];
            }));
            it('should return true if participants is empty', () => {
                expect(component.validateJudgeAndJohMembers()).toBeTruthy();
            });
            it('should return true if sole participant role is judge and does not equal search email', () => {
                component.hearing.participants.push(p1);
                component.searchEmail.email = 'judge1@user.name';
                expect(component.validateJudgeAndJohMembers()).toBeTruthy();
            });
            it('should return false if sole participant role is judge and does equal search email', () => {
                component.hearing.participants.push(p1);
                component.searchEmail.email = 'judge@user.name';
                expect(component.validateJudgeAndJohMembers()).toBeFalsy();
            });
            it('should return true if sole participant role is not judge', () => {
                component.hearing.participants.push(p2);
                component.searchEmail.email = 'judge@user.name';
                expect(component.validateJudgeAndJohMembers()).toBeTruthy();
            });
            it('should return true if a participant role is judge and does not equal search email', () => {
                component.hearing.participants.push(p2);
                component.hearing.participants.push(p1);
                component.searchEmail.email = 'judge1@user.name';
                expect(component.validateJudgeAndJohMembers()).toBeTruthy();
            });
            it('should return false if a participant role is judge and does equal search email', () => {
                component.hearing.participants.push(p2);
                component.hearing.participants.push(p1);
                component.searchEmail.email = 'judge@user.name';
                expect(component.validateJudgeAndJohMembers()).toBeFalsy();
            });
        });
    });

    describe('danged', () => {
        describe('add judge/JOH', () => {
            beforeEach(waitForAsync(() => {
                component.hearing.participants = [];
            }));

            it('should return values true/false if a participant role is judge and does equal search email', () => {
                component.hearing.participants.push(p1);
                component.searchEmail.email = 'judge@user.name';
                component.emailChanged();
                expect(component.searchEmail.isErrorEmailAssignedToJudge).toBeTruthy();
                expect(component.errorAlternativeEmail).toBeTruthy();
                expect(component.errorJohAccountNotFound).toBeFalsy();
            });
            it('should return values false if a participant role is judge and does not equal search email', () => {
                component.hearing.participants.push(p1);
                component.searchEmail.email = 'judge1@user.name';
                component.validateJudgeAndJohMembers();
                expect(component.errorAlternativeEmail).toBeFalsy();
                expect(component.errorJohAccountNotFound).toBeFalsy();
            });
        });
    });

    describe('subcribeForSeachEmailEvents', () => {
        it('should return errorAlternativeEmail & errorJohAccountNotFound as false if called with emailFoundEvent', () => {
            component.errorAlternativeEmail = true;
            component.errorJohAccountNotFound = true;
            component.subscribeForSearchEmailEvents();
            component.searchEmail.emailFoundEvent.next();
            expect(component.errorAlternativeEmail).toBeFalsy();
            expect(component.errorJohAccountNotFound).toBeFalsy();
        });
        it('should have called Not Found Participant if Not Found Email Event has been called', () => {
            spyOn(component, 'notFoundParticipant');
            component.subscribeForSearchEmailEvents();
            component.searchEmail.emailNotFoundEvent.next();
            expect(component.notFoundParticipant).toHaveBeenCalledTimes(1);
        });
    });

    describe('mapParticipant', () => {
        it('should map when interpreter enhancements flag is enabled', () => {
            // arrange
            const newParticipant = new VHParticipant();
            component.role.setValue('Interpreter');
            component.interpreterEnhancementsFlag = true;

            // act
            component.mapParticipant(newParticipant);

            // assert
            expect(newParticipant.linkedParticipants.length).toBe(0);
        });
        it('should map when interpreter enhancements flag is disabled', () => {
            // arrange
            const newParticipant = new VHParticipant();
            component.role.setValue('Interpreter');
            newParticipant.interpreterFor = 'interpretee@email.com';
            component.interpreterEnhancementsFlag = false;

            // act
            component.mapParticipant(newParticipant);

            // assert
            expect(newParticipant.linkedParticipants.length).toBe(1);
        });
    });
});

describe('AddParticipantComponent edit mode', () => {
    beforeEach(waitForAsync(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
            'getCurrentRequest',
            'setBookingHasChanged',
            'unsetBookingHasChanged',
            'updateHearingRequest',
            'cancelRequest',
            'isConferenceClosed',
            'isHearingAboutToStart',
            'getHearingRoles'
        ]);
        bookingServiceSpy = jasmine.createSpyObj<BookingService>(['isEditMode', 'getParticipantEmail', 'resetEditMode']);

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterModule.forChild([]), BookingModule, PopupModule, TestingModule],
            declarations: [MockComponent(InterpreterFormComponent), FeatureFlagDirective],
            providers: [
                { provide: SearchService, useClass: SearchServiceStub },
                { provide: Router, useValue: routerSpy },
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: ParticipantService, useValue: participantServiceSpy },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        }).compileComponents();

        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.specialMeasures).and.returnValue(of(false));

        const hearing = initExistHearingRequest();
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
        videoHearingsServiceSpy.getHearingRoles.and.returnValue(Promise.resolve(flatRoleList));
        participantServiceSpy.mapParticipantHearingRoles.and.returnValue(mappedHearingRoles);
        bookingServiceSpy.isEditMode.and.returnValue(true);
        bookingServiceSpy.getParticipantEmail.and.returnValue('test3@hmcts.net');
        configServiceSpy.getClientSettings.and.returnValue(of(new ClientSettingsResponse()));
        fixture = TestBed.createComponent(AddParticipantComponent);

        fixture.detectChanges();
        component = fixture.componentInstance;
        component.editMode = true;
        component.ngOnInit();
        fixture.detectChanges();

        role = component.form.controls['role'];
        title = component.form.controls['title'];
        firstName = component.form.controls['firstName'];
        lastName = component.form.controls['lastName'];
        email = component.form.controls['email'];
        phone = component.form.controls['phone'];
        displayName = component.form.controls['displayName'];
        companyName = component.form.controls['companyName'];
        companyNameIndividual = component.form.controls['companyNameIndividual'];
        interpretee = component.form.controls['interpreterFor'];
    }));

    afterEach(() => {});

    it('should initialize form controls', () => {
        component.initialiseForm();
        expect(component.form.controls['firstName']).toBeTruthy();
        expect(component.form.controls['firstName'].errors['required']).toBeTruthy();
        expect(component.form.controls['lastName']).toBeTruthy();
        expect(component.form.controls['lastName'].errors['required']).toBeTruthy();
        expect(component.form.controls['email']).toBeTruthy();
        expect(component.form.controls['email'].errors['required']).toBeTruthy();
    });
    it('should check text input is valid for tranformation to email address in UserApi', () => {
        // arrange
        const testCases = {
            'wil.li_am.': false,
            'Cr.aig_1234': true,
            'I.': false,
            '.william1234': false,
            _a: true,
            'Willi..amCraig1234': false,
            ' qweqwe ': false,
            'w.w': true,
            XY: true,
            A: true
        };

        component.form.setValue({
            title: 'Mr',
            firstName: participant.firstName,
            lastName: participant.lastName,
            role: 'Panel Member',
            email: participant.email,
            phone: participant.phone,
            displayName: participant.display_Name,
            companyName: participant.company,
            companyNameIndividual: participant.company,
            representing: participant.representee,
            interpreterFor: Constants.PleaseSelect
        });
        component.initialiseForm();

        for (const [test, expectedResult] of Object.entries(testCases)) {
            // act
            component.firstName.setValue(test);
            component.lastName.setValue(test);

            // assert
            if (expectedResult) {
                expect(component.form.controls['firstName'].status).toBe('VALID', `Failed for ${test}`);
                expect(component.form.controls['lastName'].status).toBe('VALID', `Failed for ${test}`);
            } else {
                expect(component.form.controls['firstName'].status).toBe('INVALID', `Failed for ${test}`);
                expect(component.form.controls['lastName'].status).toBe('INVALID', `Failed for ${test}`);
            }
        }
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
        component.searchEmail = new SearchEmailComponent(searchService, configServiceSpy, loggerSpy);
        component.searchEmail.email = 'test3@hmcts.net';

        component.ngOnInit();
        component.ngAfterViewInit();
        fixture.detectChanges();
        tick(1000);

        expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
        expect(component.hearing).toBeTruthy();
        expect(component.existingParticipant).toBeTruthy();
        expect(component.showDetails).toBeTruthy();
        expect(component.selectedParticipantEmail).toBe('test3@hmcts.net');
        expect(component.displayNextButton).toBeFalsy();
        expect(component.displayClearButton).toBeTruthy();
        expect(component.displayAddButton).toBeFalsy();
        expect(component.displayUpdateButton).toBeTruthy();

        flush();
    }));

    it('shows single role list when reference data flag is on', fakeAsync(async () => {
        const roles: HearingRoleResponse[] = [
            new HearingRoleResponse({
                name: 'Applicant',
                code: 'APPL',
                user_role: 'Individual'
            }),
            new HearingRoleResponse({
                name: 'Interpreter',
                code: 'INTP',
                user_role: 'Individual'
            }),
            new HearingRoleResponse({
                name: 'Judge',
                code: 'JUDG',
                user_role: 'Judge'
            }),
            new HearingRoleResponse({
                name: 'Litigant in person',
                code: 'LIP',
                user_role: 'Individual'
            }),
            new HearingRoleResponse({
                name: 'Staff Member',
                code: 'STAF',
                user_role: 'Staff Member'
            })
        ];
        videoHearingsServiceSpy.getHearingRoles.and.returnValue(Promise.resolve(roles));
        const hearingRolesMapped = new ParticipantService(loggerSpy).mapParticipantHearingRoles(roles);
        participantServiceSpy.mapParticipantHearingRoles.and.returnValue(hearingRolesMapped);

        component.ngOnInit();
        component.ngAfterViewInit();
        flush();
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            expect(videoHearingsServiceSpy.getHearingRoles).toHaveBeenCalled();
            expect(component.hearingRoleList).toEqual(['Please select', 'Applicant', 'Litigant in person']);
            expect(component.displayNextButton).toBeTruthy();
            expect(component.displayClearButton).toBeFalsy();
            expect(component.displayAddButton).toBeFalsy();
            expect(component.displayUpdateButton).toBeFalsy();
        });
    }));

    it('should update participant and clear form', () => {
        component.showDetails = true;
        fixture.detectChanges();
        spyOn(component.searchEmail, 'validateEmail').and.returnValue(true);
        component.searchEmail.email = 'mock@hmcts.net';

        role.setValue('Representative');
        firstName.setValue('Sam');
        lastName.setValue('Green');
        email.setValue('Sam.Green@Representative.com');
        title.setValue('Mrs');
        phone.setValue('12345');
        displayName.setValue('Sam Green');
        companyName.setValue('CC');
        component.isRoleSelected = true;
        component.isPartySelected = true;
        interpretee.setValue('test4@email.com');
        component.updateParticipant();
        const updatedParticipant = component.hearing.participants.find(x => x.email === 'mock@hmcts.net');
        expect(updatedParticipant.display_Name).toBe('Sam Green');
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
            role: 'Representative',
            title: 'Ms',
            firstName: participant.firstName,
            lastName: participant.lastName,
            email: participant.email,
            phone: participant.phone,
            displayName: participant.display_Name,
            companyName: participant.company,
            companyNameIndividual: participant.company,
            representing: participant.representee,
            interpreterFor: Constants.PleaseSelect
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
            role: '',
            title: Constants.PleaseSelect,
            firstName: participant.firstName,
            lastName: participant.lastName,
            email: participant.email,
            phone: participant.phone,
            displayName: participant.display_Name,
            companyName: participant.company,
            companyNameIndividual: participant.company,
            representing: participant.representee,
            interpreterFor: Constants.PleaseSelect
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
        expect(component.hearing.hearingId).toBeTruthy();
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
    it('should clear the linked participant model if interpretee is removed on edit', () => {
        component.editMode = true;
        component.hearing.participants = [];
        component.ngOnInit();

        const part1 = new VHParticipant();
        part1.firstName = 'firstname';
        part1.lastName = 'lastname-interpretee';
        part1.display_Name = 'firstname lastname-interpretee';
        part1.email = 'firstname.lastname-interpretee@email.com';
        part1.hearingRoleName = 'Litigant in Person';
        part1.id = '100';

        const part2 = new VHParticipant();
        part2.firstName = 'firstname';
        part2.lastName = 'lastname-interpreter';
        part2.display_Name = 'firstname lastname-interpreter';
        part2.email = 'firstname.lastname-interpreter@email.com';
        part2.hearingRoleName = 'Interpreter';
        part2.interpreterFor = 'firstname.lastname-interpretee@email.com';
        part2.id = '300';
        component.hearing.participants.push(part1);
        component.hearing.participants.push(part2);

        const linkedParticipants: LinkedParticipantModel[] = [];
        const lp = new LinkedParticipantModel();
        lp.participantEmail = 'firstname.lastname-interpreter@email.com';
        lp.linkedParticipantEmail = 'firstname.lastname-interpretee@email.com';
        lp.linkedParticipantId = '100';
        lp.participantId = '300';
        linkedParticipants.push(lp);
        component.hearing.linkedOarticipants = linkedParticipants;
        component.selectedParticipantEmail = 'firstname.lastname-interpretee@email.com';
        component.handleContinueRemoveInterpreter();
        expect(component.hearing.linkedOarticipants.length).toBe(0);
        expect(participantServiceSpy.removeParticipant).toHaveBeenCalled();
    });

    it('should update interpreter with exiting participant', () => {
        component.editMode = true;
        component.showDetails = true;
        fixture.detectChanges();
        spyOn(component.searchEmail, 'validateEmail').and.returnValue(true);
        component.searchEmail.email = 'test7@hmcts.net';
        role.setValue('Interpreter');
        firstName.setValue('Test');
        lastName.setValue('Participant8');
        title.setValue('Mr');
        phone.setValue('12345');
        displayName.setValue('Test Participant8');
        companyName.setValue('CC8');
        component.isRoleSelected = true;
        component.isPartySelected = true;
        interpretee.setValue('test8@email.com');
        component.updateParticipant();
        const updatedParticipant = component.hearing.participants.find(x => x.email === 'test8@hmcts.net');
        expect(updatedParticipant.display_Name).toBe('Test Participant8');
    });
});
describe('AddParticipantComponent edit mode no participants added', () => {
    beforeEach(waitForAsync(() => {
        const hearing = initExistHearingRequest();
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
            'getCurrentRequest',
            'setBookingHasChanged',
            'unsetBookingHasChanged',
            'updateHearingRequest',
            'cancelRequest',
            'isConferenceClosed',
            'isHearingAboutToStart',
            'getHearingRoles'
        ]);
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
        videoHearingsServiceSpy.getHearingRoles.and.returnValue(Promise.resolve(flatRoleList));
        participantServiceSpy.mapParticipantHearingRoles.and.returnValue(mappedHearingRoles);
        bookingServiceSpy = jasmine.createSpyObj<BookingService>(['getParticipantEmail', 'isEditMode', 'setEditMode', 'resetEditMode']);
        bookingServiceSpy.isEditMode.and.returnValue(true);
        bookingServiceSpy.getParticipantEmail.and.returnValue('');
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.specialMeasures).and.returnValue(of(false));

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterModule.forChild([]), BookingModule, PopupModule, TestingModule],
            declarations: [MockComponent(InterpreterFormComponent), FeatureFlagDirective],
            providers: [
                { provide: SearchService, useClass: SearchServiceStub },
                { provide: Router, useValue: routerSpy },
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: ParticipantService, useValue: participantServiceSpy },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: ConfigService, useValue: configServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AddParticipantComponent);
        component = fixture.componentInstance;
        component.participantsListComponent = new ParticipantListComponent(videoHearingsServiceSpy, launchDarklyServiceSpy);
        component.searchEmail = new SearchEmailComponent(searchService, configServiceSpy, loggerSpy);
        component.editMode = true;
        component.ngOnInit();

        role = component.form.controls['role'];
        title = component.form.controls['title'];
        firstName = component.form.controls['firstName'];
        lastName = component.form.controls['lastName'];
        email = component.form.controls['email'];
        phone = component.form.controls['phone'];
        displayName = component.form.controls['displayName'];
        companyName = component.form.controls['companyName'];
    }));
    it('should show button add participant', fakeAsync(() => {
        component.ngAfterContentInit();
        component.ngAfterViewInit();
        flush();
        fixture.detectChanges();
        tick(1000);

        fixture.whenStable().then(() => {
            expect(component.editMode).toBeTruthy();
            expect(bookingServiceSpy.getParticipantEmail).toHaveBeenCalled();
            expect(component.selectedParticipantEmail).toBe('');
            expect(component.showDetails).toBeFalsy();
            expect(component.displayNextButton).toBeFalsy();
            expect(component.displayClearButton).toBeTruthy();
            expect(component.displayAddButton).toBeTruthy();
            expect(component.displayUpdateButton).toBeFalsy();
        });
    }));

    it('should recognize a participantList', waitForAsync(() => {
        component.ngAfterContentInit();
        component.ngAfterViewInit();
        const partList = component.participantsListComponent;
        expect(partList).toBeDefined();
    }));

    it('should show all fields if the participant selected for edit', fakeAsync(() => {
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        participant.addedDuringHearing = false;
        component.ngAfterContentInit();
        component.ngAfterViewInit();
        tick(1000);
        component.participantsListComponent.canEdit = true;
        const partList = component.participantsListComponent;
        component.selectedParticipantEmail = 'test2@hmcts.net';
        partList.editParticipant(new VHParticipant({ email: 'test2@hmcts.net', isExistPerson: false, interpretation_language: undefined }));
        flush();
        expect(component.showDetails).toBeTruthy();
    }));

    it('should show confirmation to remove participant', fakeAsync(() => {
        component.ngAfterContentInit();
        component.ngAfterViewInit();
        tick(1000);
        const partList = component.participantsListComponent;
        partList.removeParticipant(
            new VHParticipant({
                email: 'test2@hmcts.net',
                isExistPerson: false,
                interpretation_language: undefined
            })
        );
        component.selectedParticipantEmail = 'test2@hmcts.net';
        partList.selectedParticipantToRemove.emit();
        tick(1000);

        expect(component.showConfirmationRemoveParticipant).toBeTruthy();
    }));
    it('should map the lp of the new participant with new participant email and lp email along with ids', () => {
        // Arrange
        participant.hearingRoleName = HearingRoles.INTERPRETER;
        component.isRoleSelected = true;
        component.form.setValue({
            role: 'Representative',
            title: 'Ms',
            firstName: participant.firstName,
            lastName: participant.lastName,
            email: participant.email,
            phone: participant.phone,
            displayName: participant.display_Name,
            companyName: participant.company,
            companyNameIndividual: participant.company,
            representing: participant.representee,
            interpreterFor: Constants.PleaseSelect
        });
        component.selectedParticipantEmail = component.hearing.participants[3].email;
        component.showDetails = true;
        component.editMode = true;
        component.localEditMode = true;
        component.errorAlternativeEmail = false;
        component.participantDetails = participant;
        component.hearing = initExistHearingRequest();
        const participantsLPs: LinkedParticipantModel[] = [];
        const participantLp = new LinkedParticipantModel();
        participantLp.linkType = LinkedParticipantType.Interpreter;
        participantLp.linkedParticipantId = component.hearing.participants[3].id; // interpreter
        participantLp.participantId = component.hearing.participants[4].id; // participant
        participantsLPs.push(participantLp);
        const interpreterLPs: LinkedParticipantModel[] = [];
        const interpreterLp = new LinkedParticipantModel();
        interpreterLp.linkType = LinkedParticipantType.Interpreter;
        interpreterLp.linkedParticipantId = component.hearing.participants[1].id; // participant
        interpreterLp.participantId = component.hearing.participants[3].id; // interpreter
        interpreterLPs.push(participantLp);
        component.hearing.participants[1].linkedParticipants = interpreterLPs;
        component.hearing.linkedOarticipants = participantsLPs;

        // Act
        component.updateParticipantAction();

        // Assert
        expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
        expect(component.hearing.participants[1].linkedParticipants[0].linkedParticipantId).toBe(component.hearing.participants[3].id);
    });
    it('should display add button if participant has no email set', fakeAsync(() => {
        component.ngAfterContentInit();
        component.ngAfterViewInit();
        component.selectedParticipantEmail = '';
        component.ngOnInit();
        tick(1000);

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
    it('should set hearing role value from the input field', () => {
        participant.id = undefined;
        participant.hearingRoleName = undefined;
        component.isRoleSelected = true;
        component.participantDetails = participant;

        component.resetPartyAndRole();
        expect(component.participantDetails.hearingRoleName).toBeTruthy();
        expect(component.participantDetails.hearingRoleName).toEqual(Constants.PleaseSelect);
    });
    it('should disable first and last names fields if the person exist in data store', () => {
        participant.isExistPerson = true;
        component.participantDetails = participant;
        component.getParticipant(participant);

        expect(component.form.get('firstName').disabled).toBeTruthy();
        expect(component.form.get('lastName').disabled).toBeTruthy();
    });
    it('should set values correctly when no participant found', () => {
        participant.isExistPerson = true;
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

    describe('with interpreter enhancements', () => {
        beforeEach(async () => {
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(true));
            configServiceSpy.getClientSettings.and.returnValue(of(new ClientSettingsResponse()));
            fixture = TestBed.createComponent(AddParticipantComponent);
            component = fixture.componentInstance;
            const searchServiceStub = jasmine.createSpyObj<SearchService>(['participantSearch']);
            component.searchEmail = new SearchEmailComponent(searchServiceStub, configServiceSpy, loggerSpy);
            component.searchEmail.email = 'test3@hmcts.net';
            component.showDetails = true;

            fixture.detectChanges();
        });

        it('should show interpreter form when role is selected', fakeAsync(() => {
            component.form.controls.role.setValue('Representative');

            fixture.detectChanges();
            flush();

            expect(component.interpreterForm).toBeDefined();
        }));

        it('should force language selection when interpreter role is selected', fakeAsync(() => {
            component.form.controls.role.setValue('Interpreter', { emitEvent: true });
            component.roleSelected();

            fixture.detectChanges();
            flush();

            expect(component.isInterpreter).toBeTrue();
            expect(component.interpreterForm).toBeDefined();
        }));

        it('should set the interpreterSelection when onInterpreterLanguageSelected is called', () => {
            const interpreterSelection: InterpreterSelectedDto = {
                interpreterRequired: true,
                signLanguageCode: 'BSL',
                spokenLanguageCode: undefined
            };
            component.onInterpreterLanguageSelected(interpreterSelection);
            expect(component.interpreterSelection).toEqual(interpreterSelection);
        });

        it('should reset interpreterSelection when no interpreter is required', () => {
            component.interpreterSelection = {
                interpreterRequired: true,
                signLanguageCode: 'BSL',
                spokenLanguageCode: undefined
            };

            const newSelection: InterpreterSelectedDto = {
                interpreterRequired: false,
                signLanguageCode: undefined,
                spokenLanguageCode: undefined
            };

            component.onInterpreterLanguageSelected(newSelection);
            expect(component.interpreterSelection).toBeNull();
        });
    });
});
describe('AddParticipantComponent set representer', () => {
    beforeEach(waitForAsync(() => {
        const hearing = initExistHearingRequest();
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
        videoHearingsServiceSpy.getHearingRoles.and.returnValue(Promise.resolve(flatRoleList));
        participantServiceSpy.mapParticipantHearingRoles.and.returnValue(mappedHearingRoles);
        bookingServiceSpy.isEditMode.and.returnValue(true);
        bookingServiceSpy.getParticipantEmail.and.returnValue('');

        const searchServiceStab = jasmine.createSpyObj<SearchService>(['participantSearch']);

        component = new AddParticipantComponent(
            searchServiceStab,
            videoHearingsServiceSpy,
            participantServiceSpy,
            { ...routerSpy, ...jasmine.createSpyObj<Router>(['navigate']) } as jasmine.SpyObj<Router>,
            bookingServiceSpy,
            launchDarklyServiceSpy,
            loggerSpy
        );
        component.searchEmail = new SearchEmailComponent(searchServiceStab, configServiceSpy, loggerSpy);
        component.participantsListComponent = new ParticipantListComponent(videoHearingsServiceSpy, launchDarklyServiceSpy);

        component.ngOnInit();

        role = component.form.controls['role'];
        title = component.form.controls['title'];
        firstName = component.form.controls['firstName'];
        lastName = component.form.controls['lastName'];
        email = component.form.controls['email'];
        phone = component.form.controls['phone'];
        displayName = component.form.controls['displayName'];
        companyName = component.form.controls['companyName'];
        representing = component.form.controls['representing'];
        component.hearingRoles = [];

        component.ngAfterViewInit();
    }));

    it('should show company and name of representing person', () => {
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
    it('should set representee label for representatives', () => {
        component.form.get('role').setValue('Representative');
        component.roleSelected();

        expect(component.representeeLabelText).toBe('Representing');
        expect(component.representeeErrorMessage).toBe(Constants.Error.RepresenteeErrorMsg);
    });
    it('should set representee label for intermediaries', () => {
        component.form.get('role').setValue('Intermediary');
        component.roleSelected();

        expect(component.representeeLabelText).toBe('Intermediary for');
        expect(component.representeeErrorMessage).toBe(Constants.Error.IntermediaryForErrorMsg);
    });
    it('should set email of existing participant after initialize content of the component', () => {
        component.editMode = true;
        component.searchEmail = new SearchEmailComponent(
            jasmine.createSpyObj<SearchService>(['participantSearch']),
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
        const result = component.isRoleRepresentative('Representative');
        expect(result).toBe(true);
    });
    it('should indicate that role Barrister is Representative', () => {
        const result = component.isRoleRepresentative('Barrister');
        expect(result).toBe(true);
    });
    it('should indicate that role is not representative', () => {
        const result = component.isRoleRepresentative('someRole');
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
    it('should show an error if panel member who has the same eJudiciary account as a judge', () => {
        const hearing = initHearingRequest();
        const judge = hearing.participants.find(x => x.isJudge);
        participant.hearingRoleName = 'Panel Member';
        participant.username = judge.username;
        component.hearing = hearing;
        component.participantDetails = participant;
        component.searchEmail.email = judge.username;

        component.getParticipant(participant);
        expect(component.searchEmail.isErrorEmailAssignedToJudge).toBe(true);
        expect(component.errorAlternativeEmail).toBe(true);
    });
});
