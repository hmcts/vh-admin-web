import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import {
    AddNewJusticeUserRequest,
    BHClient,
    EditJusticeUserRequest,
    JusticeUserResponse,
    JusticeUserRole,
    RestoreJusticeUserRequest
} from './clients/api-client';

import { JusticeUsersService } from './justice-users.service';

describe('JusticeUsersService', () => {
    let service: JusticeUsersService;
    let clientApiSpy: jasmine.SpyObj<BHClient>;

    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>([
            'getUserList',
            'addNewJusticeUser',
            'deleteJusticeUser',
            'editJusticeUser',
            'restoreJusticeUser'
        ]);

        TestBed.configureTestingModule({ providers: [{ provide: BHClient, useValue: clientApiSpy }] });
        service = TestBed.inject(JusticeUsersService);
    });

    describe('retrieveJusticeUserAccounts', () => {
        it('should call api when retrieving justice user accounts', (done: DoneFn) => {
            const users: JusticeUserResponse[] = [
                new JusticeUserResponse({ id: '123', contact_email: 'user1@test.com' }),
                new JusticeUserResponse({ id: '456', contact_email: 'user2@test.com' }),
                new JusticeUserResponse({ id: '789', contact_email: 'user3@test.com' })
            ];
            clientApiSpy.getUserList.and.returnValue(of(users));
            service.retrieveJusticeUserAccounts().subscribe(result => {
                expect(result).toEqual(users);
                done();
            });
        });

        it('should not call api when retrieving justice user accounts and users have been already been cached', (done: DoneFn) => {
            const users: JusticeUserResponse[] = [
                new JusticeUserResponse({ id: '123', contact_email: 'user1@test.com' }),
                new JusticeUserResponse({ id: '456', contact_email: 'user2@test.com' }),
                new JusticeUserResponse({ id: '789', contact_email: 'user3@test.com' })
            ];
            service['cache$'] = of(users);
            clientApiSpy.getUserList.and.returnValue(of(users));
            service.retrieveJusticeUserAccounts().subscribe(result => {
                expect(result).toEqual(users);
                expect(clientApiSpy.getUserList).toHaveBeenCalledTimes(0);
                done();
            });
        });

        it('should call api and return user list', (done: DoneFn) => {
            const users: JusticeUserResponse[] = [new JusticeUserResponse({ id: '123', contact_email: 'user1@test.com' })];
            const term = 'user1';
            clientApiSpy.getUserList.and.returnValue(of(users));
            service.retrieveJusticeUserAccountsNoCache(term).subscribe(result => {
                expect(result).toEqual(users);
                expect(clientApiSpy.getUserList).toHaveBeenCalledTimes(1);
                done();
            });
        });
    });

    describe('addNewJusticeUser', () => {
        it('should call the api to save a new user', fakeAsync(() => {
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
            let result: JusticeUserResponse;

            service.addNewJusticeUser(username, firstName, lastName, telephone, role).subscribe(data => (result = data));
            tick();
            const request = new AddNewJusticeUserRequest({
                username: username,
                first_name: firstName,
                last_name: lastName,
                contact_telephone: telephone,
                role: role
            });
            expect(result).toEqual(newUser);
            expect(clientApiSpy.addNewJusticeUser).toHaveBeenCalledWith(request);
        }));
    });

    describe('editJusticeUser', () => {
        it('should call the api to edit an existing user', fakeAsync(() => {
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
            let result: JusticeUserResponse;

            service.editJusticeUser(id, username, role).subscribe(data => (result = data));
            tick();
            const request = new EditJusticeUserRequest({
                id,
                username,
                role
            });
            expect(result).toEqual(existingUser);
            expect(clientApiSpy.editJusticeUser).toHaveBeenCalledWith(request);
        }));
    });

    describe('deleteJusticeUser', () => {
        it('should call the api to delete the user', () => {
            clientApiSpy.deleteJusticeUser.and.returnValue(of(''));
            const id = '123';
            service.deleteJusticeUser(id).subscribe();
            expect(clientApiSpy.deleteJusticeUser).toHaveBeenCalledWith(id);
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
