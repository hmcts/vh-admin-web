import { TestBed } from '@angular/core/testing';
import { combineLatest, of } from 'rxjs';
import { count, delay, switchMap, take } from 'rxjs/operators';
import {
    AddNewJusticeUserRequest,
    BHClient,
    EditJusticeUserRequest,
    JusticeUserResponse,
    JusticeUserRole,
    RestoreJusticeUserRequest
} from './clients/api-client';

import { JusticeUsersService } from './justice-users.service';
import { Logger } from './logger';

describe('JusticeUsersService', () => {
    let service: JusticeUsersService;
    let clientApiSpy: jasmine.SpyObj<BHClient>;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);

    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>([
            'getUserList',
            'addNewJusticeUser',
            'deleteJusticeUser',
            'editJusticeUser',
            'restoreJusticeUser'
        ]);

        TestBed.configureTestingModule({
            providers: [
                { provide: BHClient, useValue: clientApiSpy },
                { provide: Logger, useValue: loggerSpy }
            ]
        });
        service = TestBed.inject(JusticeUsersService);
    });

    describe('`users$` observable', () => {
        it('should emit users returned from api', (done: DoneFn) => {
            const users: JusticeUserResponse[] = [
                new JusticeUserResponse({ id: '123', contact_email: 'user1@test.com' }),
                new JusticeUserResponse({ id: '456', contact_email: 'user2@test.com' }),
                new JusticeUserResponse({ id: '789', contact_email: 'user3@test.com' })
            ];
            clientApiSpy.getUserList.and.returnValue(of(users));
            service.allUsers$.subscribe(result => {
                expect(result).toEqual(users);
                done();
            });
        });

        it('should not make additional api requests when additional observers subscribe', (done: DoneFn) => {
            clientApiSpy.getUserList.and.returnValue(of([]));

            combineLatest([service.allUsers$, service.allUsers$])
                .pipe(
                    delay(1000),
                    switchMap(x => service.allUsers$)
                )
                .subscribe(() => {
                    expect(clientApiSpy.getUserList).toHaveBeenCalledTimes(1);
                    done();
                });
        });
    });

    describe('search()', () => {
        it('should trigger an emission from $users observable each time it is called', (done: DoneFn) => {
            // arrange
            clientApiSpy.getUserList.and.returnValue(of([]));

            //  after calling search() two times, we should see 2 emissions from users$
            service.filteredUsers$.pipe(take(2), count()).subscribe(c => {
                // assert
                expect(c).toBe(2);
                done();
            });

            // act
            service.search('');
            service.search('');
        });

        it('should apply a filter to the users collection', () => {
            // arrange
            const users: JusticeUserResponse[] = [
                new JusticeUserResponse({
                    id: '123',
                    contact_email: 'user1@test.com',
                    first_name: 'Test',
                    lastname: 'Test',
                    username: 'Test'
                }),
                new JusticeUserResponse({
                    id: '456',
                    contact_email: 'user2@test.com',
                    first_name: 'Another',
                    lastname: 'Another',
                    username: 'Another'
                }),
                new JusticeUserResponse({
                    id: '789',
                    contact_email: 'user3@test.com',
                    first_name: 'Last',
                    lastname: 'Last',
                    username: 'Last'
                })
            ];

            // act
            const filteredUsers = service.applyFilter('Test', users);

            // assert
            expect(filteredUsers[0].first_name).toBe('Test');
        });
    });

    describe('refresh()', () => {
        it('should trigger another emission from $users observable', (done: DoneFn) => {
            // arrange
            clientApiSpy.getUserList.and.returnValue(of([]));

            // users$ will emit initially - after calling refresh() two more times, we should see 3 emissions from users$
            service.allUsers$.pipe(take(3), count()).subscribe(c => {
                // assert
                expect(c).toBe(3);
                done();
            });

            // act
            service.refresh();
            service.refresh();
        });
    });

    describe('addNewJusticeUser', () => {
        it('should call the api to save a new user & again to get the users list', (done: DoneFn) => {
            const username = 'john@doe.com';
            const firstName = 'john';
            const lastName = 'doe';
            const telephone = '01234567890';
            const role = JusticeUserRole.VhTeamLead;

            const newUser = new JusticeUserResponse({
                id: '123',
                contact_email: username,
                username,
                first_name: firstName,
                lastname: lastName,
                telephone: telephone,
                is_vh_team_leader: true
            });

            clientApiSpy.addNewJusticeUser.and.returnValue(of(newUser));
            clientApiSpy.getUserList.and.returnValue(of([]));

            const request = new AddNewJusticeUserRequest({
                username: username,
                first_name: firstName,
                last_name: lastName,
                contact_telephone: telephone,
                role: role
            });

            combineLatest([service.allUsers$, service.addNewJusticeUser(username, firstName, lastName, telephone, role)]).subscribe(
                ([_, userResponse]: [JusticeUserResponse[], JusticeUserResponse]) => {
                    expect(clientApiSpy.getUserList).toHaveBeenCalledTimes(2);
                    expect(userResponse).toEqual(newUser);
                    expect(clientApiSpy.addNewJusticeUser).toHaveBeenCalledWith(request);
                    done();
                }
            );
        });
    });

    describe('editJusticeUser', () => {
        it('should call the api to edit an existing user & again to get the users list', (done: DoneFn) => {
            const id = '123';
            const username = 'john@doe.com';
            const firstName = 'john';
            const lastName = 'doe';
            const telephone = '01234567890';
            const role = JusticeUserRole.VhTeamLead;

            const existingUser = new JusticeUserResponse({
                contact_email: username,
                username,
                first_name: firstName,
                lastname: lastName,
                telephone: telephone,
                is_vh_team_leader: true
            });

            clientApiSpy.editJusticeUser.and.returnValue(of(existingUser));
            clientApiSpy.getUserList.and.returnValue(of([]));

            const request = new EditJusticeUserRequest({
                id,
                username,
                role
            });

            combineLatest([service.allUsers$, service.editJusticeUser(id, username, role)]).subscribe(
                ([_, result]: [JusticeUserResponse[], JusticeUserResponse]) => {
                    expect(clientApiSpy.getUserList).toHaveBeenCalledTimes(2);
                    expect(result).toEqual(existingUser);
                    expect(clientApiSpy.editJusticeUser).toHaveBeenCalledWith(request);
                    done();
                }
            );
        });
    });

    describe('deleteJusticeUser', () => {
        it('should call the api to delete the user & again to get the users list', (done: DoneFn) => {
            clientApiSpy.deleteJusticeUser.and.returnValue(of(''));
            clientApiSpy.getUserList.and.returnValue(of([]));

            const id = '123';
            combineLatest([service.allUsers$, service.deleteJusticeUser(id)]).subscribe(() => {
                expect(clientApiSpy.getUserList).toHaveBeenCalledTimes(2);
                expect(clientApiSpy.deleteJusticeUser).toHaveBeenCalledWith(id);
                done();
            });
        });
    });

    describe('restoreJusticeUser', () => {
        it('should call the api to restore the user', () => {
            clientApiSpy.restoreJusticeUser.and.returnValue(of(''));
            const id = '123';
            const username = 'user1@test.com';
            const request = new RestoreJusticeUserRequest({
                id,
                username
            });
            service.restoreJusticeUser(id, username).subscribe();
            expect(clientApiSpy.restoreJusticeUser).toHaveBeenCalledWith(request);
        });
    });
});
