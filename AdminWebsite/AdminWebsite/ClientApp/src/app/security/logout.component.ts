import { OnInit, Component, Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html'
})
@Injectable()
export class LogoutComponent implements OnInit {
    constructor(private oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.oidcSecurityService.isAuthenticated$.subscribe(auth => {
            if (auth) {
                this.oidcSecurityService.logoffAndRevokeTokens();
            }
        });
    }
}
