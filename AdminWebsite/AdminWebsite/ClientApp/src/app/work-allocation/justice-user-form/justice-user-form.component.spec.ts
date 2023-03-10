import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { newGuid } from '@microsoft/applicationinsights-core-js';
import { of, throwError } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { BookHearingException, JusticeUserResponse, ValidationProblemDetails } from 'src/app/services/clients/api-client';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { Logger } from 'src/app/services/logger';
import { MockLogger } from 'src/app/shared/testing/mock-logger';

import { JusticeUserFormComponent } from './justice-user-form.component';

describe('JusticeUserFormComponent', () => {
    const justiceUsersServiceSpy = jasmine.createSpyObj<JusticeUsersService>('JusticeUsersService', [
        'addNewJusticeUser',
        'editJusticeUser'
    ]);

    let component: JusticeUserFormComponent;
    let fixture: ComponentFixture<JusticeUserFormComponent>;
    const existngUser = new JusticeUserResponse({
        contact_email: 'test@cso.com',
        first_name: 'John',
        lastname: 'Doe',
        username: 'test@cso.com',
        telephone: null
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JusticeUserFormComponent],
            providers: [
                { provide: Logger, useValue: new MockLogger() },
                { provide: JusticeUsersService, useValue: justiceUsersServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(JusticeUserFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.justiceUser = existngUser;
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
            expect(component.form.controls.contactTelephone.disabled).toBeTruthy();
            expect(component.form.controls.firstName.disabled).toBeTruthy();
            expect(component.form.controls.lastName.disabled).toBeTruthy();
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
                user_role_name: 'Team Leader',
                is_vh_team_leader: true,
                username: 'new@cso.com',
                telephone: '01234567890'
            });
            justiceUsersServiceSpy.addNewJusticeUser.and.returnValue(of(newUser));

            // act
            component.onSave();

            // assert
            expect(spy).toHaveBeenCalledWith(newUser);
            expect(component.showSpinner).toBeFalsy();
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
                user_role_name: 'Team Leader',
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
            expect(component.showSpinner).toBeFalsy();
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
                `Detected an existing user for the username ${existngUser.username}`,
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
            justiceUsersServiceSpy.addNewJusticeUser.and.returnValue(throwError(validationProblem));

            // act
            component.onSave();
            tick();

            // assert
            expect(component.failedSaveMessage).toBe(validationProblem.title);
            expect(component.form.controls.firstName.errors.errorMessage).toContain(validationProblem.errors.FirstName);
            expect(component.form.controls.lastName.errors.errorMessage).toContain(validationProblem.errors.LastName);
        }));
    });
});
