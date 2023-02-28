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

    describe('displayForm', () => {
        it('should display justice user form when displayForm has been selected', () => {
            // arrange
            component.displayMessage = true;
            component.showForm = false;

            // act
            component.displayForm();

            // assert
            expect(component.displayMessage).toBeFalsy();
            expect(component.showForm).toBeTruthy();
        });
    });

    describe('justiceFormEventHandlers', () => {
        it('should hide form when add new user is cancelled', () => {
            // arrange
            component.showForm = true;

            // act
            component.onFormCancelled();

            // assert
            expect(component.showForm).toBeFalsy();
        });

        it('should add newly created user to search results to display', () => {
            // arrange
            component.users = [];
            component.showForm = true;
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
            expect(component.showForm).toBeFalsy();
            expect(component.displayAddButton).toBeFalsy();
            expect(component.message).toBe(Constants.ManageJusticeUsers.NewUserAdded);
            expect(component.isAnErrorMessage).toBeFalsy();
            expect(component.users[0]).toBe(newUser);
        });
    });
});
