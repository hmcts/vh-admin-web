import { TestBed } from '@angular/core/testing';
import { SecurityService, IdpProviders } from './security.service';
import { OidcSecurityService, OpenIdConfiguration, LoginResponse } from 'angular-auth-oidc-client';
import { of } from 'rxjs';

describe('SecurityService', () => {
    let service: SecurityService;
    let oidcSecurityServiceSpy: jasmine.SpyObj<OidcSecurityService>;

    beforeEach(() => {
        oidcSecurityServiceSpy = jasmine.createSpyObj('OidcSecurityService', [
            'authorize',
            'isAuthenticated',
            'checkAuthMultiple',
            'getAccessToken',
            'logoffAndRevokeTokens',
            'getConfiguration'
        ]);

        TestBed.configureTestingModule({
            providers: [SecurityService, { provide: OidcSecurityService, useValue: oidcSecurityServiceSpy }]
        });

        service = TestBed.inject(SecurityService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set and get currentIdpConfigId', () => {
        service.currentIdpConfigId = IdpProviders.reform;
        expect(service.currentIdpConfigId).toEqual(IdpProviders.reform);
    });

    it('should call authorize method', () => {
        service.authorize();
        expect(oidcSecurityServiceSpy.authorize).toHaveBeenCalled();
    });

    it('should call isAuthenticated method', () => {
        oidcSecurityServiceSpy.isAuthenticated.and.returnValue(of(true));

        service.isAuthenticated().subscribe(result => {
            expect(result).toBeTrue();
        });

        expect(oidcSecurityServiceSpy.isAuthenticated).toHaveBeenCalled();
    });

    it('should call checkAuthMultiple method', () => {
        oidcSecurityServiceSpy.checkAuthMultiple.and.returnValue(of([]));

        service.checkAuthMultiple().subscribe(result => {
            expect(result).toEqual([]);
        });

        expect(oidcSecurityServiceSpy.checkAuthMultiple).toHaveBeenCalledWith(null);
    });

    it('should call getAccessToken method', () => {
        oidcSecurityServiceSpy.getAccessToken.and.returnValue(of('access_token'));

        service.getAccessToken().subscribe(result => {
            expect(result).toEqual('access_token');
        });

        expect(oidcSecurityServiceSpy.getAccessToken).toHaveBeenCalled();
    });

    it('should call logoffAndRevokeTokens method', () => {
        oidcSecurityServiceSpy.logoffAndRevokeTokens.and.returnValue(of({}));

        service.logoffAndRevokeTokens().subscribe(result => {
            expect(result).toEqual({});
        });

        expect(oidcSecurityServiceSpy.logoffAndRevokeTokens).toHaveBeenCalled();
    });

    it('should call getConfiguration method', () => {
        oidcSecurityServiceSpy.getConfiguration.and.returnValue(of({} as OpenIdConfiguration));

        service.getConfiguration().subscribe(result => {
            expect(result).toEqual({});
        });

        expect(oidcSecurityServiceSpy.getConfiguration).toHaveBeenCalledWith(IdpProviders.main);
    });
});
