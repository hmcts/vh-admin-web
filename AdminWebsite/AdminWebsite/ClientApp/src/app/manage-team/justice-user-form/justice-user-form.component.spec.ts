import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { newGuid } from '@microsoft/applicationinsights-core-js';
import { of, throwError } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { BookHearingException, JusticeUserResponse, JusticeUserRole, ValidationProblemDetails } from 'src/app/services/clients/api-client';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { Logger } from 'src/app/services/logger';
import { MockLogger } from 'src/app/shared/testing/mock-logger';

import { JusticeUserFormComponent } from './justice-user-form.component';
import { LaunchDarklyService, FeatureFlags } from 'src/app/services/launch-darkly.service';
import { ReactiveFormsModule } from '@angular/forms';

describe('JusticeUserFormComponent', () => {
    const justiceUsersServiceSpy = jasmine.createSpyObj<JusticeUsersService>('JusticeUsersService', [
        'addNewJusticeUser',
        'editJusticeUser'
    ]);

    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);

    let component: JusticeUserFormComponent;
    let fixture: ComponentFixture<JusticeUserFormComponent>;
    const existingUser = new JusticeUserResponse({
        contact_email: 'test@cso.com',
        first_name: 'John',
        lastname: 'Doe',
        username: 'test@cso.com',
        telephone: null,
        user_roles: [JusticeUserRole.Vho]
    });

    beforeEach(async () => {
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.dom1Integration).and.returnValue(of(false));

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule],
            declarations: [JusticeUserFormComponent],
            providers: [
                { provide: Logger, useValue: new MockLogger() },
                { provide: JusticeUsersService, useValue: justiceUsersServiceSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(JusticeUserFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.justiceUser = existingUser;
    });

    describe('contact telephone validation on form', () => {
        it('should have valid form for empty contact telephone', () => {
            component.form.controls.username.setValue(existingUser.username);
            component.form.controls.firstName.setValue(existingUser.first_name);
            component.form.controls.lastName.setValue(existingUser.lastname);
            component.form.controls.contactTelephone.setValue(existingUser.telephone);
            component.form.controls.roles.setValue([true, false]);
            expect(component.form.invalid).toBe(false);
        });

        it('should have valid form for valid contact telephone', () => {
            component.form.controls.username.setValue(existingUser.username);
            component.form.controls.firstName.setValue(existingUser.first_name);
            component.form.controls.lastName.setValue(existingUser.lastname);
            component.form.controls.contactTelephone.setValue('+441234567890');
            component.form.controls.roles.setValue([true, false]);
            expect(component.form.invalid).toBe(false);
        });

        it('should have invalid form for invalid contact telephone', () => {
            component.form.controls.username.setValue(existingUser.username);
            component.form.controls.firstName.setValue(existingUser.first_name);
            component.form.controls.lastName.setValue(existingUser.lastname);
            component.form.controls.contactTelephone.setValue('abcd');
            component.form.controls.roles.setValue([true, false]);
            expect(component.form.invalid).toBe(true);
        });
    });

    describe('on form cancellation', () => {
        it('should emit cancel event when form is cancelled', () => {
            // arrange
            const spy = spyOn(component.cancelFormEvent, 'emit');

            // act
            component.onCancel();

            // assert
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('edit mode set-up', () => {
        it('should disable form fields in edit mode', () => {
            // arrange / act
            const changes: SimpleChanges = {
                mode: new SimpleChange(null, 'edit', true)
            };
            component.ngOnChanges(changes);

            // assert
            expect(component.form.controls.contactTelephone.disabled).toBeFalsy();
            expect(component.form.controls.firstName.disabled).toBeFalsy();
            expect(component.form.controls.lastName.disabled).toBeFalsy();
            expect(component.form.controls.username.disabled).toBeTruthy();
        });
    });

    describe('on form save', () => {
        it('should emit new user on successful save', fakeAsync(() => {
            // arrange
            const spy = spyOn(component.saveSuccessfulEvent, 'emit');
            const newUser = new JusticeUserResponse({
                id: newGuid(),
                contact_email: 'new@cso.com',
                first_name: 'Jack',
                lastname: 'Jones',
                full_name: 'Jack Jones',
                user_roles: [JusticeUserRole.VhTeamLead],
                is_vh_team_leader: true,
                username: 'new@cso.com',
                telephone: '01234567890'
            });
            justiceUsersServiceSpy.addNewJusticeUser.and.returnValue(of(newUser));

            // act
            component.onSave();

            // assert
            expect(spy).toHaveBeenCalledWith(newUser);
            expect(component.isSaving).toBeFalsy();
        }));

        it('should emit an updated user on successful save', fakeAsync(() => {
            // arrange
            const spy = spyOn(component.saveSuccessfulEvent, 'emit');
            const updatedUser = new JusticeUserResponse({
                id: newGuid(),
                contact_email: 'new@cso.com',
                first_name: 'Jack',
                lastname: 'Jones',
                full_name: 'Jack Jones',
                user_roles: [JusticeUserRole.VhTeamLead],
                is_vh_team_leader: true,
                username: 'new@cso.com',
                telephone: '01234567890'
            });
            justiceUsersServiceSpy.editJusticeUser.and.returnValue(of(updatedUser));
            component.mode = 'edit';

            // act
            component.onSave();

            // assert
            expect(spy).toHaveBeenCalledWith(updatedUser);
            expect(component.isSaving).toBeFalsy();
        }));

        it('should display generic error message when unexpected api error occurs', fakeAsync(() => {
            // arrange
            justiceUsersServiceSpy.addNewJusticeUser.and.returnValue(throwError('random api error'));

            // act
            component.onSave();
            tick();

            // assert
            expect(component.failedSaveMessage).toBe(Constants.Error.JusticeUserForm.SaveError);
        }));

        it('should existing username message when api returns conflict', fakeAsync(() => {
            // arrange
            const exception = new BookHearingException(
                'Conflict',
                409,
                `Detected an existing user for the username ${existingUser.username}`,
                null,
                null
            );
            justiceUsersServiceSpy.addNewJusticeUser.and.returnValue(throwError(exception));

            // act
            component.onSave();
            tick();

            // assert
            expect(component.failedSaveMessage).toBe(Constants.Error.JusticeUserForm.SaveErrorDuplicateUser);
        }));

        it('should set control errors for properties returned by a validationproblem object from the api', fakeAsync(() => {
            // arrange
            const validationProblem = new ValidationProblemDetails({
                errors: {
                    FirstName: ['First name is required'],
                    LastName: ['Last Name is required'],
                    ContactEmail: ['Contact Email is required']
                },
                type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
                title: 'One or more validation errors occurred.',
                status: 400
            });

            justiceUsersServiceSpy.addNewJusticeUser.and.returnValue(
                throwError(
                    () => new BookHearingException('Bad Request', 400, 'One or more validation errors occurred.', null, validationProblem)
                )
            );

            // act
            component.onSave();
            tick();

            // assert
            expect(component.failedSaveMessage).toBe(validationProblem.title);
            expect(component.form.controls.firstName.errors.errorMessage).toContain(validationProblem.errors.FirstName);
            expect(component.form.controls.lastName.errors.errorMessage).toContain(validationProblem.errors.LastName);
        }));
    });

    describe('on form creation dom1 off', () => {
        beforeEach(async () => {
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.dom1Integration).and.returnValue(of(false));
            fixture = TestBed.createComponent(JusticeUserFormComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create form with default values', () => {
            // arrange / act
            const form = component.form;

            // assert
            expect(form.controls.username.value).toBe('');
            expect(form.controls.contactTelephone.value).toBe('');
            expect(form.controls.firstName.value).toBe('');
            expect(form.controls.lastName.value).toBe('');
            // Assuming that the order in the formArray is VHO, ADMIN
            expect(form.controls.roles.value).toEqual([true, false]);
        });
    });

    describe('on form creation dom1 on', () => {
        beforeEach(async () => {
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.dom1Integration).and.returnValue(of(true));
            fixture = TestBed.createComponent(JusticeUserFormComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create form with default values', () => {
            // arrange / act
            const form = component.form;

            // assert
            expect(form.controls.username.value).toBe('');
            expect(form.controls.contactTelephone.value).toBe('');
            expect(form.controls.firstName.value).toBe('');
            expect(form.controls.lastName.value).toBe('');
            // Assuming that the order in the formArray is VHO, ADMIN, STAFFMEMBER
            expect(form.controls.roles.value).toEqual([true, false, false]);
        });

        it('should clear form when user set to null', () => {
            // arrange / act
            component.justiceUser = null;
            const form = component.form;

            // assert
            expect(form.controls.username.value).toBe('');
            expect(form.controls.contactTelephone.value).toBe('');
            expect(form.controls.firstName.value).toBe('');
            expect(form.controls.lastName.value).toBe('');
            // Assuming that the order in the formArray is VHO, ADMIN, STAFFMEMBER
            expect(form.controls.roles.value).toEqual([true, false, false]);
        });
    });
});
