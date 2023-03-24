import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ManageTeamComponent } from './manage-team.component';
import { FormBuilder } from '@angular/forms';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { Logger } from '../../services/logger';
import { BHClient, BookHearingException, JusticeUserResponse } from '../../services/clients/api-client';
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
        justiceUsersServiceSpy = jasmine.createSpyObj<JusticeUsersService>('JusticeUsersService', ['retrieveJusticeUserAccountsNoCache']);
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

    describe('displayForm', () => {
        it('should display justice user form when displayForm has been selected', () => {
            // arrange
            component.displayMessage = true;
            component.showUserForm = false;

            // act
            component.displayUserForm();

            // assert
            expect(component.displayMessage).toBeFalsy();
            expect(component.showUserForm).toBeTruthy();
        });
    });

    describe('justiceFormEventHandlers', () => {
        it('should hide form when add new user is cancelled', () => {
            // arrange
            component.showUserForm = true;

            // act
            component.onUserFormCancelled();

            // assert
            expect(component.showUserForm).toBeFalsy();
        });

        it('should add newly created user to search results to display', () => {
            // arrange
            component.users = [];
            component.showUserForm = true;
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
            component.onJusticeUserSuccessfulSave(newUser);

            // assert
            expect(component.showUserForm).toBeFalsy();
            expect(component.displayAddButton).toBeFalsy();
            expect(component.message).toBe(Constants.ManageJusticeUsers.NewUserAdded);
            expect(component.isAnErrorMessage).toBeFalsy();
            expect(component.users[0]).toBe(newUser);
        });

        it('should update user in search results to display after editing', () => {
            // arrange
            component.showUserForm = true;
            const id = newGuid();
            const newUser = new JusticeUserResponse({
                id,
                contact_email: 'new@cso.com',
                first_name: 'Jack',
                lastname: 'Jones',
                full_name: 'Jack Jones',
                user_role_name: 'Team Leader',
                is_vh_team_leader: true,
                username: 'new@cso.com',
                telephone: '01234567890'
            });

            component.users = [newUser];
            component.userFormMode = 'edit';

            const updatedUser = new JusticeUserResponse({
                id,
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
            component.onJusticeUserSuccessfulSave(updatedUser);

            // assert
            expect(component.showUserForm).toBeFalsy();
            expect(component.displayAddButton).toBeFalsy();
            expect(component.message).toBe(Constants.ManageJusticeUsers.UserEdited);
            expect(component.isAnErrorMessage).toBeFalsy();
            expect(component.users[0]).toBe(updatedUser);
        });
    });

    describe('onDeleteJusticeUser', () => {
        it('should display delete justice user popup', () => {
            // arrange
            const userToDelete = new JusticeUserResponse({
                id: newGuid(),
                contact_email: 'user@email.com',
                first_name: 'Test',
                lastname: 'User',
                full_name: 'Test User',
                user_role_name: 'Team Leader',
                is_vh_team_leader: true,
                username: 'user@email.com',
                telephone: ''
            });

            // act
            component.onDeleteJusticeUser(userToDelete);

            // assert
            expect(component.userToDelete).toBe(userToDelete);
            expect(component.displayDeleteUserPopup).toBeTruthy();
        });
    });

    describe('onCancelDeleteJusticeUser', () => {
        it('should hide delete justice user popup', () => {
            // arrange & act
            component.onCancelDeleteJusticeUser();

            // assert
            expect(component.userToDelete).toBeNull();
            expect(component.displayDeleteUserPopup).toBeFalsy();
        });
    });

    describe('onJusticeUserSuccessfulDelete', () => {
        it('should hide delete justice user popup and update user list', () => {
            // arrange
            const userToDelete = new JusticeUserResponse({
                id: newGuid(),
                contact_email: 'userToDelete@email.com',
                first_name: 'Test',
                lastname: 'UserToDelete',
                full_name: 'Test User To Delete',
                user_role_name: 'Team Leader',
                is_vh_team_leader: true,
                username: 'userToDelete@email.com',
                telephone: ''
            });
            component.users = [];
            component.users.push(userToDelete);
            component.userToDelete = userToDelete;
            component.displayDeleteUserPopup = true;

            // act
            component.onJusticeUserSuccessfulDelete();

            // assert
            expect(component.displayDeleteUserPopup).toBeFalsy();
            expect(component.message).toBe(Constants.ManageJusticeUsers.UserDeleted);
            expect(component.displayMessage).toBeTruthy();
            expect(component.users[0].deleted).toBe(true);
        });
    });

    describe('onJusticeUserSuccessfulRestore', () => {
        it('should hide restore justice user popup and update user', () => {
            // arrange
            const userToRestore = new JusticeUserResponse({
                id: newGuid(),
                contact_email: 'userToRestore@email.com',
                first_name: 'Test',
                lastname: 'UserToRestore',
                full_name: 'Test User To Restore',
                user_role_name: 'Team Leader',
                is_vh_team_leader: true,
                username: 'userToRestore@email.com',
                telephone: '',
                deleted: true
            });
            component.users = [];
            component.users.push(userToRestore);
            component.userToRestore = userToRestore;
            component.displayRestoreUserPopup = true;

            // act
            component.onJusticeUserSuccessfulRestore();

            // assert
            expect(component.displayRestoreUserPopup).toBeFalsy();
            expect(component.message).toBe(Constants.ManageJusticeUsers.UserRestored);
            expect(component.displayMessage).toBeTruthy();
            expect(component.users[0].deleted).toBe(false);
        });
    });

    describe('editUser', () => {
        it('should display edit role popup', () => {
            // arrange
            const userToEdit = new JusticeUserResponse({
                id: newGuid(),
                contact_email: 'user@email.com',
                first_name: 'Test',
                lastname: 'User',
                full_name: 'Test User',
                user_role_name: 'Team Leader',
                is_vh_team_leader: true,
                username: 'user@email.com',
                telephone: ''
            });

            // act
            component.editUser(userToEdit);

            // assert
            expect(component.selectedUser).toBe(userToEdit);
            expect(component.userFormMode).toBe('edit');
            expect(component.displayMessage).toBeFalsy();
            expect(component.showUserForm).toBeTruthy();
        });
    });

    describe('restoreUser', () => {
        it('should display restore user popup', () => {
            // arrange
            const userToRestore = new JusticeUserResponse({
                id: newGuid(),
                contact_email: 'user@email.com',
                first_name: 'Test',
                lastname: 'User',
                full_name: 'Test User',
                user_role_name: 'Team Leader',
                is_vh_team_leader: true,
                username: 'user@email.com',
                telephone: '',
                deleted: true
            });

            // act
            component.restoreUser(userToRestore);

            // assert
            expect(component.userToRestore).toBe(userToRestore);
            expect(component.displayMessage).toBeFalsy();
            expect(component.displayRestoreUserPopup).toBeTruthy();
        });
    });
});
