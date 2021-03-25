import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PageUrls } from '../shared/page-url.constants';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

    canActivate(): Observable<boolean> {
        return this.oidcSecurityService.isAuthenticated$.pipe(
            map((isAuthorized: boolean) => {
                console.log('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);
                if (!isAuthorized) {
                    this.router.navigate([`/${PageUrls.Login}`]);
                    return false;
                }

                return true;
            })
        );
    }
}
