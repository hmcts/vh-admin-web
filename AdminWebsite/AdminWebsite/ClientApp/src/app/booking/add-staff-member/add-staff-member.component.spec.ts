import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { newGuid } from '@microsoft/applicationinsights-core-js';
import { MockComponent } from 'ng-mocks';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { provide } from 'src/app/testing/helpers/jasmine.helpers';
import { AddParticipantBaseDirective } from '../add-participant-base/add-participant-base.component';
import { SearchEmailComponent } from '../search-email/search-email.component';

import { AddStaffMemberComponent } from './add-staff-member.component';

describe('AddStaffMemberComponent', () => {
    let component: AddStaffMemberComponent;
    let fixture: ComponentFixture<AddStaffMemberComponent>;

    let bookingServiceSpy: jasmine.SpyObj<BookingService>;
    let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    const staffMemberRole = Constants.HearingRoles.StaffMember;
    const existingStaffMember = new ParticipantModel({
        display_name: 'I Exist',
        first_name: 'I',
        last_name: 'Exist',
        phone: '07123456789',
        email: 'I.Exist@Nihilism.void',
        user_role_name: staffMemberRole,
        hearing_role_name: staffMemberRole,
        case_role_name: staffMemberRole
    });
    const judgeParticipant = new ParticipantModel({
        display_name: 'I Judge',
        first_name: 'IJudge',
        last_name: 'Exist Judge',
        phone: '07123456789',
        email: 'I.Judge@Nihilism.void',
        user_role_name: Constants.HearingRoles.Judge,
        hearing_role_name: Constants.HearingRoles.Judge,
        case_role_name: Constants.HearingRoles.Judge,
        username: 'username.judge@hmcts'
    });

    beforeEach(waitForAsync(() => {
        bookingServiceSpy = jasmine.createSpyObj('BookingService', ['']);
        videoHearingsServiceSpy = jasmine.createSpyObj('VideoHearingsService', ['getCurrentRequest']);
        routerSpy = jasmine.createSpyObj('Router', ['']);
        loggerSpy = jasmine.createSpyObj('Logger', ['']);

        TestBed.configureTestingModule({
            imports: [FormsModule, ReactiveFormsModule],
            declarations: [AddStaffMemberComponent, MockComponent(SearchEmailComponent)],
            providers: [
                provide(BookingService, bookingServiceSpy),
                provide(Logger, loggerSpy),
                provide(Router, routerSpy),
                provide(VideoHearingsService, videoHearingsServiceSpy)
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddStaffMemberComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('ngOnInit', () => {
        it('should initialise the form', () => {
            component.initialiseForm = spyOn(component, 'initialiseForm');

            component.ngOnInit();

            expect(component.initialiseForm).toHaveBeenCalledTimes(1);
        });

        it('should retrieve the staff member if it exists and apply details', done => {
            const courtId = 954874;

            const hearingModel = new HearingModel();
            hearingModel.court_id = courtId;
            hearingModel.participants = [existingStaffMember];
            hearingModel.hearing_id = newGuid();

            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearingModel);

            component.isStaffMemberValid.subscribe(valid => {
                expect(valid).toBe(true);
                done();
            });

            component.staffMember.subscribe(staffMember => {
                expect(staffMember).toEqual(existingStaffMember);
                done();
            });
            component.ngOnInit();
            fixture.detectChanges();
            const searchEmailComponent = fixture.debugElement.query(By.directive(SearchEmailComponent));

            expect(component.displayName.value).toBe(existingStaffMember.display_name);
            expect(component.firstName.value).toBe(existingStaffMember.first_name);
            expect(component.lastName.value).toBe(existingStaffMember.last_name);
            expect(component.phone.value).toBe(existingStaffMember.phone);
            expect(component.email.value).toBe(existingStaffMember.email);
            expect(searchEmailComponent.componentInstance.initialValue).toBe(existingStaffMember.email);
            expect(component.isBookedHearing).toBe(true);
        });

        it('should setup event emissions', () => {
            component.setupStaffMemberValidityEmissionOnFormValueChange = spyOn(
                component,
                'setupStaffMemberValidityEmissionOnFormValueChange'
            );
            component.setupStaffMemberEmissionWhenValid = spyOn(component, 'setupStaffMemberEmissionWhenValid');

            component.ngOnInit();

            expect(component.setupStaffMemberValidityEmissionOnFormValueChange).toHaveBeenCalledTimes(1);
            expect(component.setupStaffMemberEmissionWhenValid).toHaveBeenCalledTimes(1);
        });
    });

    describe('initialiseForm', () => {
        it('should call super method implementation', () => {
            const initialiseFormSpy = spyOn(AddParticipantBaseDirective.prototype, 'initialiseForm');

            component.initialiseForm();

            expect(initialiseFormSpy).toHaveBeenCalledTimes(1);
        });

        it('should set role value', () => {
            const hearingModel = new HearingModel();
            hearingModel.participants = [existingStaffMember];
            component.hearing = hearingModel;
            component.initialiseForm();
            expect(component.role.value).toBe(staffMemberRole);
            expect(component.form.get('interpreterFor')).toBeFalsy();
            expect(component.form.get('displayName').value).toBe(existingStaffMember.display_name);
            expect(component.form.get('title').value).toBe(Constants.PleaseSelect);
            expect(component.form.get('lastName').value).toBe(existingStaffMember.last_name);
            expect(component.form.get('firstName').value).toBe(existingStaffMember.first_name);
            expect(component.form.get('email').value).toBe(existingStaffMember.email);
            expect(component.form.get('phone').value).toBe(existingStaffMember.phone);
            expect(component.form.get('party').value).toBe(Constants.PleaseSelect);
            expect(component.emailDisabled).toBe(false);
            expect(component.form.get('lastName').disabled).toBe(false);
            expect(component.form.get('firstName').disabled).toBe(false);
        });
        it('should grey out email, firstname and lastname', () => {
            const hearingModel = new HearingModel();
            component.isBookedHearing = true;
            hearingModel.participants = [existingStaffMember];
            component.hearing = hearingModel;
            component.initialiseForm();
            expect(component.emailDisabled).toBe(true);
            expect(component.form.get('lastName').disabled).toBe(true);
            expect(component.form.get('firstName').disabled).toBe(true);
        });

        it('should set form interpreterFor is removed for staff member', () => {
            const hearingModel = new HearingModel();
            hearingModel.participants = [existingStaffMember, judgeParticipant];
            component.hearing = hearingModel;
            component.searchEmail.email = existingStaffMember.email;
            component.getParticipant(existingStaffMember);
            expect(component.form.get('interpreterFor')).toBeFalsy();
        });
    });

    describe('setupStaffMemberValidityEmissionOnFormValueChange', () => {
        it('should subscribe to email changes when search email exists', fakeAsync(done => {
            const email = 'email@email.com';
            component.isSubscribedToEmailChanges = false;

            tick();
            component.searchEmail.emailChanged.subscribe(value => {
                expect(value).toBe(email);
                done();
            });

            component.setupStaffMemberValidityEmissionOnFormValueChange();

            component.role.setValue('newRole');
        }));

        it('should emit if staff member is valid on form change', done => {
            component.isStaffMemberValid.subscribe(valid => {
                expect(valid).not.toBeNull();
                done();
            });

            component.setupStaffMemberValidityEmissionOnFormValueChange();

            component.role.setValue('newRole');
        });

        it('should add subscriptions to subscriptions array', () => {
            component.$subscriptions = [];
            component.isSubscribedToEmailChanges = false;

            component.setupStaffMemberValidityEmissionOnFormValueChange();
            component.role.setValue('newRole');

            expect(component.$subscriptions.length).toBe(2);
        });
    });

    describe('setupStaffMemberEmissionWhenValid', () => {
        it('should add staff member validity to subscriptions array', () => {
            component.$subscriptions = [];

            component.setupStaffMemberEmissionWhenValid();

            expect(component.$subscriptions.length).toBe(1);
        });

        it('should emit staff member if valid', done => {
            component.staffMember.subscribe(staffMember => {
                expect(staffMember).not.toBeNull();
                done();
            });

            component.setupStaffMemberEmissionWhenValid();

            component.isStaffMemberValid.emit(true);
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe all subcriptions on destroy component', () => {
            component.$subscriptions.push(new Subscription(), new Subscription());
            expect(component.$subscriptions[0].closed).toBeFalsy();
            expect(component.$subscriptions[1].closed).toBeFalsy();

            component.ngOnDestroy();

            expect(component.$subscriptions[0].closed).toBeTruthy();
            expect(component.$subscriptions[1].closed).toBeTruthy();
        });
    });
});
