import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { AddJusticeUserRequest, BHClient, JusticeUserResponse, JusticeUserRole } from './clients/api-client';

import { JusticeUsersService } from './justice-users.service';

describe('JusticeUsersService', () => {
    let service: JusticeUsersService;
    let clientApiSpy: jasmine.SpyObj<BHClient>;

    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>(['getUserList', 'addNewJusticeUser']);

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
            const request = new AddJusticeUserRequest({
                username: username,
                first_name: firstName,
                last_name: lastName,
                telephone: telephone,
                role: role
            });
            expect(result).toEqual(newUser);
            expect(clientApiSpy.addNewJusticeUser).toHaveBeenCalledWith(request);
        }));
    });
});
