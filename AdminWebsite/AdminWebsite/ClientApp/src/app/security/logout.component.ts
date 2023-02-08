import { OnInit, Component, Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { UserIdentityService } from '../services/user-identity.service';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html'
})
@Injectable()
export class LogoutComponent implements OnInit {
    constructor(private oidcSecurityService: OidcSecurityService, private userIdentityService: UserIdentityService) {}

    ngOnInit() {
        this.oidcSecurityService.isAuthenticated$.subscribe(auth => {
            if (auth) {
                this.userIdentityService.clearUserProfile();
                this.oidcSecurityService.logoffAndRevokeTokens();
            }
        });
    }
}
