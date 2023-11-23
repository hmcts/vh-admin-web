import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PageUrls } from '../shared/page-url.constants';
import { Logger } from '../services/logger';
import {SecurityConfigService} from "./services/security-config.service";
import {ISecurityService} from "./services/security-service.interface";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly loggerPrefix = '[AuthorizationGuard] -';
    private securityService: ISecurityService;
    private currentIdp: string;
    constructor(private securityConfigService: SecurityConfigService, private router: Router, private logger: Logger) {
        this.securityConfigService.currentIdpConfigId$.subscribe(idp => {
            this.currentIdp = idp;
        });
        this.securityService = this.securityConfigService.getSecurityService();

    }

    canActivate(): Observable<boolean> {
        return this.securityService.isAuthenticated(this.currentIdp).pipe(
            map((result: boolean) => {
                if (!result) {
                    this.logger.warn(`${this.loggerPrefix}- canActivate isAuthorized: ` + result);
                    this.router.navigate([`/${PageUrls.Login}`]);
                    return false;
                }
                this.logger.debug(`${this.loggerPrefix}- canActivate isAuthorized: ` + result);
                return true;
            })
        );
    }
}
