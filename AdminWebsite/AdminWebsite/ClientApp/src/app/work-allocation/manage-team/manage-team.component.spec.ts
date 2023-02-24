import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ManageTeamComponent } from './manage-team.component';
import { FormBuilder } from '@angular/forms';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { Logger } from '../../services/logger';
import { BHClient, BookHearingException, ExistingJusticeUserResponse, JusticeUserResponse } from '../../services/clients/api-client';
import { of, throwError } from 'rxjs';
import { JusticeUsersService } from '../../services/justice-users.service';
import { Component } from '@angular/core';
import { newGuid } from '@microsoft/applicationinsights-core-js';
import { MockLogger } from 'src/app/shared/testing/mock-logger';
import { Constants } from 'src/app/common/constants';

@Component({ selector: 'app-justice-user-form', template: '' })
export class JusticeUserFormStubComponent {}

describe('ManageTeamComponent', () => {
    let component: ManageTeamComponent;
    let fixture: ComponentFixture<ManageTeamComponent>;
    let justiceUsersServiceSpy: jasmine.SpyObj<JusticeUsersService>;
    let users: JusticeUserResponse[] = [];

    beforeEach(async () => {
        justiceUsersServiceSpy = jasmine.createSpyObj<JusticeUsersService>('JusticeUsersService', [
            'retrieveJusticeUserAccountsNoCache',
            'checkIfUserExistsByUsername'
        ]);
        users = [];

        await TestBed.configureTestingModule({
            declarations: [ManageTeamComponent, JusticeUserFormStubComponent],
            providers: [
                FormBuilder,
                HttpClient,
                HttpHandler,
                { provide: Logger, useValue: new MockLogger() },
                { provide: JusticeUsersService, useValue: justiceUsersServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ManageTeamComponent);
        component = fixture.componentInstance;

        justiceUsersServiceSpy.retrieveJusticeUserAccountsNoCache.calls.reset();
        fixture.detectChanges();
    });

    describe('searchUsers', () => {
        it('it should display add new user button when search with a valid email returns an empty list', fakeAsync(() => {
            // arrange
            const emptyList: JusticeUserResponse[] = [];
            justiceUsersServiceSpy.retrieveJusticeUserAccountsNoCache.and.returnValue(of(emptyList));
            component.form.controls.inputSearch.setValue('test@cso.com');

            // act
            component.searchUsers();
            tick();

            // assert
            expect(justiceUsersServiceSpy.retrieveJusticeUserAccountsNoCache).toHaveBeenCalled();
            expect(component.message).toContain('No users matching this search criteria were found.');
            expect(component.displayAddButton).toBeTruthy();
        }));

        it('it should not display add new user button when search term is not an email address', fakeAsync(() => {
            // arrange
            const emptyList: JusticeUserResponse[] = [];
            justiceUsersServiceSpy.retrieveJusticeUserAccountsNoCache.and.returnValue(of(emptyList));
            component.form.controls.inputSearch.setValue('test');

            // act
            component.searchUsers();
            tick();

            // assert
            expect(justiceUsersServiceSpy.retrieveJusticeUserAccountsNoCache).toHaveBeenCalled();
            expect(component.displayAddButton).toBeFalsy();
        }));

        it('should display portion of users when search returns a list of users exceeds filter limit', fakeAsync(() => {
            // arrange
            users = Array.from(Array(30).keys()).map(
                i =>
                    new JusticeUserResponse({
                        id: newGuid(),
                        username: `username${i + 1}@mail.com`
                    })
            );
            justiceUsersServiceSpy.retrieveJusticeUserAccountsNoCache.and.returnValue(of(users));
            component.form.controls.inputSearch.setValue('username');

            // act
            component.searchUsers();
            tick();

            // assert
            expect(component.displayAddButton).toBeFalsy();
            expect(component.displayMessage).toBeTruthy();
            expect(component.users.length).toEqual(component['filterSize']);
            expect(component.message).toContain('please refine your search to see more results.');
        }));

        it('should users when search returns a list of users exceeds filter limit', fakeAsync(() => {
            // arrange
            users = Array.from(Array(10).keys()).map(
                i =>
                    new JusticeUserResponse({
                        id: newGuid(),
                        username: `username${i + 1}@mail.com`
                    })
            );
            justiceUsersServiceSpy.retrieveJusticeUserAccountsNoCache.and.returnValue(of(users));
            component.form.controls.inputSearch.setValue('username');

            // act
            component.searchUsers();
            tick();

            // assert
            expect(component.displayAddButton).toBeFalsy();
            expect(component.displayMessage).toBeFalsy();
            expect(component.users.length).toEqual(10);
        }));

        it('should display error when searching throws an error', fakeAsync(() => {
            // arrange
            justiceUsersServiceSpy.retrieveJusticeUserAccountsNoCache.and.returnValue(throwError('Random API error'));
            component.form.controls.inputSearch.setValue('test@cso.com');

            // act
            component.searchUsers();
            tick();

            // assert
            expect(justiceUsersServiceSpy.retrieveJusticeUserAccountsNoCache).toHaveBeenCalled();
            expect(component.message).toBe(Constants.Error.ManageJusticeUsers.SearchFailure);
        }));
    });

    describe('searchForExistingAccount', () => {
        it('should update form input when checking for an existing account return an user', fakeAsync(() => {
            // arrange
            const existngUser = new ExistingJusticeUserResponse({
                contact_email: 'test@cso.com',
                first_name: 'John',
                last_name: 'Doe',
                username: 'test@cso.com'
            });
            component.form.controls.inputSearch.setValue(existngUser.contact_email);
            justiceUsersServiceSpy.checkIfUserExistsByUsername.and.returnValue(of(existngUser));

            // act
            component.searchForExistingAccount();
            tick();

            // assert
            expect(component.existingAccount).toBe(existngUser);
        }));

        it('should display a user account does not exist message when checking for an existing account returns a 404', fakeAsync(() => {
            // arrange
            const errorMessage =
                'Username could not be found. Please check the username and try again. An account may need to be requested via Service Catalogue.';
            justiceUsersServiceSpy.checkIfUserExistsByUsername.and.returnValue(throwError(errorMessage));

            // act
            component.searchForExistingAccount();
            tick();

            // assert
            expect(component.message).toBe(errorMessage);
            expect(component.displayMessage).toBeTruthy();
        }));

        it('should display a standard error message when checking for an existng account fails', fakeAsync(() => {
            // arrange
            const exception = new BookHearingException('Server Error', 500, 'Random error', null, null);
            justiceUsersServiceSpy.checkIfUserExistsByUsername.and.returnValue(throwError(exception));

            // act
            component.searchForExistingAccount();
            tick();

            // assert
            expect(component.message).toBe(Constants.Error.ManageJusticeUsers.SearchFailure);
            expect(component.displayMessage).toBeTruthy();
        }));
    });

    describe('justiceFormEventHandlers', () => {
        it('should clear variables when add new user is cancelled', () => {
            // arrange
            component.existingAccount = new ExistingJusticeUserResponse({ first_name: 'john' });

            // act
            component.onFormCancelled();

            // assert
            expect(component.existingAccount).toBeNull();
        });

        it('should add newly created user to search results to display', () => {
            // arrange
            component.users = [];
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

            // act
            component.onJusticeSuccessfulSave(newUser);

            // assert
            expect(component.existingAccount).toBeNull();
            expect(component.displayAddButton).toBeFalsy();
            expect(component.message).toBe(Constants.ManageJusticeUsers.NewUserAdded);
            expect(component.isAnErrorMessage).toBeFalsy();
            expect(component.users[0]).toBe(newUser);
        });
    });
});
