import { OnInit, Component, Injectable } from '@angular/core';
import { UserIdentityService } from '../services/user-identity.service';
import {SecurityConfigService} from "./services/security-config.service";
import {ISecurityService} from "./services/security-service.interface";

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html'
})
@Injectable()
export class LogoutComponent implements OnInit {
    private securityService: ISecurityService;
    constructor(private configService: SecurityConfigService, private userIdentityService: UserIdentityService) {
        this.securityService = this.configService.getSecurityService();
    }

    ngOnInit() {
        this.securityService.isAuthenticated(this.configService.currentIdpConfigId).subscribe(auth => {
            if (auth) {
                this.userIdentityService.clearUserProfile();
                this.securityService.logoffAndRevokeTokens(this.configService.currentIdpConfigId).subscribe();
            }
        });
    }
}
