import { OnInit, Component, Injectable } from '@angular/core';
import { UserIdentityService } from '../services/user-identity.service';
import { SecurityService } from './services/security.service';
@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html',
    standalone: false
})
@Injectable()
export class LogoutComponent implements OnInit {
    constructor(
        private readonly securityService: SecurityService,
        private readonly userIdentityService: UserIdentityService
    ) {}

    ngOnInit() {
        this.securityService.isAuthenticated().subscribe(auth => {
            if (auth) {
                this.userIdentityService.clearUserProfile();
                this.securityService.logoffAndRevokeTokens().subscribe();
            }
        });
    }
}
