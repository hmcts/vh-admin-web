import { OnInit, Component, Injectable } from '@angular/core';
import { UserIdentityService } from '../services/user-identity.service';
import { VhOidcSecurityService } from './vh-oidc-security.service';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html'
})
@Injectable()
export class LogoutComponent implements OnInit {
    constructor(private oidcSecurityService: VhOidcSecurityService, private userIdentityService: UserIdentityService) {}

    ngOnInit() {
        this.oidcSecurityService.isAuthenticated().subscribe(auth => {
            if (auth) {
                this.userIdentityService.clearUserProfile();
                this.oidcSecurityService.logoffAndRevokeTokens().subscribe();
            }
        });
    }
}
