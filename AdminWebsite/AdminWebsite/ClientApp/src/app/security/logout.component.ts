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
    private currentIdp: string;
    constructor(private configService: SecurityConfigService, private userIdentityService: UserIdentityService) {
        this.configService.currentIdpConfigId$.subscribe(idp => {
            this.currentIdp = idp;
        });
        this.securityService = this.configService.getSecurityService();
    }

    ngOnInit() {
        this.securityService.isAuthenticated(this.currentIdp).subscribe(auth => {
            if (auth) {
                this.userIdentityService.clearUserProfile();
                this.securityService.logoffAndRevokeTokens(this.currentIdp).subscribe();
            }
        });
    }
}
