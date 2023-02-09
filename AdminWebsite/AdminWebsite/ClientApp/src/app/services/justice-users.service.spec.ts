import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BHClient, JusticeUserResponse } from './clients/api-client';

import { JusticeUsersService } from './justice-users.service';

describe('JusticeUsersService', () => {
    let service: JusticeUsersService;
    let clientApiSpy: jasmine.SpyObj<BHClient>;

    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<BHClient>(['getUserList']);

        TestBed.configureTestingModule({ providers: [{ provide: BHClient, useValue: clientApiSpy }] });
        service = TestBed.inject(JusticeUsersService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call api', (done: DoneFn) => {
        const users: JusticeUserResponse[] = [
            new JusticeUserResponse({ id: '123', contact_email: 'user1@test.com' }),
            new JusticeUserResponse({ id: '456', contact_email: 'user2@test.com' }),
            new JusticeUserResponse({ id: '789', contact_email: 'user3@test.com' })
        ];
        clientApiSpy.getUserList.and.returnValue(of(users));
        service.retrieveJusticeUserAccounts(null).subscribe(result => {
            expect(result).toEqual(users);
            done();
        });
    });

    it('should not call api when users have been cached', (done: DoneFn) => {
        const users: JusticeUserResponse[] = [
            new JusticeUserResponse({ id: '123', contact_email: 'user1@test.com' }),
            new JusticeUserResponse({ id: '456', contact_email: 'user2@test.com' }),
            new JusticeUserResponse({ id: '789', contact_email: 'user3@test.com' })
        ];
        service['cache$'] = of(users);
        clientApiSpy.getUserList.and.returnValue(of(users));
        service.retrieveJusticeUserAccounts(null).subscribe(result => {
            expect(result).toEqual(users);
            expect(clientApiSpy.getUserList).toHaveBeenCalledTimes(0);
            done();
        });
    });
});
