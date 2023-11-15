import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageTeamComponent } from './manage-team.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { Logger } from '../../services/logger';
import { JusticeUserResponse, JusticeUserRole } from '../../services/clients/api-client';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { JusticeUsersService } from '../../services/justice-users.service';
import { Component } from '@angular/core';
import { newGuid } from '@microsoft/applicationinsights-core-js';
import { MockLogger } from 'src/app/shared/testing/mock-logger';
import { Constants } from 'src/app/common/constants';
import { JusticeUserFormComponent, JusticeUserFormMode } from '../justice-user-form/justice-user-form.component';
import { RolesToDisplayPipe } from '../../shared/pipes/roles-to-display.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipDirective } from 'src/app/shared/directives/tooltip.directive';

@Component({ selector: 'app-justice-user-form', template: '' })
export class JusticeUserFormStubComponent {}

describe('ManageTeamComponent', () => {
    let component: ManageTeamComponent;
    let fixture: ComponentFixture<ManageTeamComponent>;
    let justiceUsersServiceSpy: jasmine.SpyObj<JusticeUsersService>;

    const filteredUsers$ = new BehaviorSubject<JusticeUserResponse[]>([]);

    beforeEach(async () => {
        justiceUsersServiceSpy = jasmine.createSpyObj<JusticeUsersService>('JusticeUsersService', [
            'allUsers$',
            'filteredUsers$',
            'search'
        ]);
        justiceUsersServiceSpy.filteredUsers$ = filteredUsers$;

        await TestBed.configureTestingModule({
            declarations: [ManageTeamComponent, JusticeUserFormStubComponent, RolesToDisplayPipe, TooltipDirective],
            providers: [
                FormBuilder,
                HttpClient,
                HttpHandler,
                TooltipDirective,
                { provide: Logger, useValue: new MockLogger() },
                { provide: JusticeUsersService, useValue: justiceUsersServiceSpy },
                { provide: JusticeUserFormComponent, useClass: JusticeUserFormStubComponent }
            ],
            imports: [ReactiveFormsModule, FontAwesomeModule]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ManageTeamComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        fixture.detectChanges();
    });

    describe('searchUsers', () => {
        it('it should display add new user button when the user list is empty', (done: DoneFn) => {
            component.displayAddButton$.subscribe((displayAddButton: boolean) => {
                expect(displayAddButton).toBeTruthy();
                done();
            });
        });

        it('should display a portion of users when search returns a list of users that exceeds filter limit', (done: DoneFn) => {
            // act
            filteredUsers$.next(
                Array.from(Array(30).keys()).map(
                    i =>
                        new JusticeUserResponse({
                            id: newGuid(),
                            username: `username${i + 1}@mail.com`,
                            user_roles: [JusticeUserRole.Vho, JusticeUserRole.StaffMember]
                        })
                )
            );

            // assert
            combineLatest([component.users$, component.displayMessage$, component.message$, component.displayAddButton$]).subscribe(
                ([users, displayMessage, message, displayAddButton]: [JusticeUserResponse[], boolean, string, boolean]) => {
                    expect(users.length).toEqual(20);
                    expect(message).toContain('please refine your search to see more results.');
                    expect(displayMessage).toBeTruthy();
                    expect(displayAddButton).toBeFalsy();
                    done();
                }
            );
        });

        it('should display all users when search returns a list of users not exceeding filter limit', (done: DoneFn) => {
            // act
            filteredUsers$.next(
                Array.from(Array(10).keys()).map(
                    i =>
                        new JusticeUserResponse({
                            id: newGuid(),
                            username: `username${i + 1}@mail.com`,
                            user_roles: [JusticeUserRole.Vho]
                        })
                )
            );

            // assert
            combineLatest([
                component.users$,
                component.displayAddButton$,
                component.isAnErrorMessage$,
                component.displayMessage$
            ]).subscribe(
                ([users, displayAddButton, isAnErrorMessage, displayMessage]: [JusticeUserResponse[], boolean, boolean, boolean]) => {
                    expect(users.length).toEqual(10);
                    expect(displayMessage).toBeFalsy();
                    expect(displayAddButton).toBeFalsy();
                    expect(isAnErrorMessage).toBeFalsy();
                    done();
                }
            );
        });
    });

    describe('displayForm', () => {
        it('should display justice user form when displayForm has been clicked', (done: DoneFn) => {
            // act
            component.displayUserForm();

            // assert
            combineLatest([component.displayMessage$, component.showForm$]).subscribe(([displayMessage, showForm]: [boolean, boolean]) => {
                expect(displayMessage).toBeFalsy();
                expect(showForm).toBeTruthy();
                done();
            });
        });
    });

    describe('Deleting users', () => {
        describe('onDeleteJusticeUser', () => {
            it('should display delete justice user popup', (done: DoneFn) => {
                // arrange
                const userToDelete = new JusticeUserResponse({
                    id: newGuid(),
                    contact_email: 'user@email.com',
                    first_name: 'Test',
                    lastname: 'User',
                    full_name: 'Test User',
                    user_roles: [JusticeUserRole.VhTeamLead, JusticeUserRole.StaffMember],
                    is_vh_team_leader: true,
                    username: 'user@email.com',
                    telephone: ''
                });

                // act
                component.onDeleteJusticeUser(userToDelete);

                // assert
                component.displayDeleteUserPopup$.subscribe(displayDeleteUserPopup => {
                    expect(displayDeleteUserPopup).toBeTruthy();
                    expect(component.userToDelete).toBe(userToDelete);
                    done();
                });
            });
        });

        describe('onJusticeUserSuccessfulDelete', () => {
            it('should hide delete justice user popup & display success message', (done: DoneFn) => {
                // arrange & act
                component.onJusticeUserSuccessfulDelete();

                // assert
                expect(component.userToDelete).toBeNull();
                combineLatest([component.displayDeleteUserPopup$, component.message$, component.displayMessage$]).subscribe(
                    ([displayDeleteUserPopup, message, displayMessage]: [boolean, string, boolean]) => {
                        expect(displayDeleteUserPopup).toBeFalsy();
                        expect(message).toBe(Constants.ManageJusticeUsers.UserDeleted);
                        expect(displayMessage).toBeTruthy();
                        done();
                    }
                );
            });
        });

        describe('onCancelDeleteJusticeUser', () => {
            it('should hide delete justice user popup', (done: DoneFn) => {
                // arrange & act
                component.onCancelDeleteJusticeUser();

                // assert
                component.displayDeleteUserPopup$.subscribe(displayDeleteUserPopup => {
                    expect(displayDeleteUserPopup).toBeFalsy();
                    expect(component.userToDelete).toBeNull();
                    done();
                });
            });
        });
    });

    describe('Editing users', () => {
        it('should display edit role popup', (done: DoneFn) => {
            // arrange
            const userToEdit = new JusticeUserResponse({
                id: newGuid(),
                contact_email: 'user@email.com',
                first_name: 'Test',
                lastname: 'User',
                full_name: 'Test User',
                user_roles: [JusticeUserRole.VhTeamLead],
                is_vh_team_leader: true,
                username: 'user@email.com',
                telephone: ''
            });

            // act
            component.editUser(userToEdit);

            // assert
            combineLatest([component.showForm$, component.displayMessage$, component.selectedUser$, component.userFormMode$]).subscribe(
                ([showForm, displayMessage, selectedUser, userFormMode]: [boolean, boolean, JusticeUserResponse, JusticeUserFormMode]) => {
                    expect(displayMessage).toBeFalsy();
                    expect(showForm).toBeTruthy();
                    expect(selectedUser).toBe(userToEdit);
                    expect(userFormMode).toBe('edit');
                    done();
                }
            );
        });
    });

    describe('Adding users', () => {
        describe('onJusticeSuccessfulSave', () => {
            it('should reset the view after save', (done: DoneFn) => {
                component.onJusticeUserSuccessfulSave();

                combineLatest([component.showForm$, component.isAnErrorMessage$, component.displayMessage$]).subscribe(
                    ([showForm, isAnErrorMessage, displayMessage]: [boolean, boolean, boolean]) => {
                        expect(displayMessage).toBeTruthy();
                        expect(isAnErrorMessage).toBeFalsy();
                        expect(showForm).toBeFalsy();
                        done();
                    }
                );
            });

            it('should display new user added message on successful add user', (done: DoneFn) => {
                // arrange
                component.userFormMode$.next('add');

                // act
                component.onJusticeUserSuccessfulSave();

                // assert
                combineLatest([component.message$]).subscribe(([message]: [string]) => {
                    expect(message).toBe(Constants.ManageJusticeUsers.NewUserAdded);
                    done();
                });
            });

            it('should display user edited message on successful edit user', (done: DoneFn) => {
                // arrange
                component.userFormMode$.next('edit');

                // act
                component.onJusticeUserSuccessfulSave();

                // assert
                component.message$.subscribe(message => {
                    expect(message).toBe(Constants.ManageJusticeUsers.UserEdited);
                    done();
                });
            });
        });
    });

    describe('User form', () => {
        it('should hide form when add new user is cancelled', () => {
            // arrange
            component.displayUserForm();

            // act
            component.onUserFormCancelled();

            // assert
            component.showForm$.subscribe(showForm => expect(showForm).toBeFalsy());
        });
    });
});
