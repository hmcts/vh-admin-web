import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {PageUrls} from '../shared/page-url.constants';
import {Logger} from '../services/logger';
import {IdpProviders, SecurityConfigService} from "./services/security-config.service";
import {ISecurityService} from "./services/security-service.interface";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly loggerPrefix = '[AuthorizationGuard] -';
    private securityService: ISecurityService;
    constructor(private securityConfigService: SecurityConfigService, private router: Router, private logger: Logger) {
        this.securityService = this.securityConfigService.getSecurityService();
    }

    canActivate(): Observable<boolean> {
        const configId = this.securityConfigService.currentIdpConfigId;
        return this.securityService.isAuthenticated(configId).pipe(
            map((result: boolean) => {
                if (!result) {
                    const loginUrl = configId == IdpProviders.dom1 ? PageUrls.Login : PageUrls.LoginReform
                    this.logger.warn(`${this.loggerPrefix}- canActivate isAuthorized: ` + result);
                    this.router.navigate([`/${loginUrl}`]);
                    return false;
                }
                this.logger.debug(`${this.loggerPrefix}- canActivate isAuthorized: ` + result);
                return true;
            })
        );
    }
}
