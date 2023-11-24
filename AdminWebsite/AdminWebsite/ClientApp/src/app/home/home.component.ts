import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import {SecurityConfigService} from "../security/services/security-config.service";
import {ISecurityService} from "../security/services/security-service.interface";
import {Observable} from "rxjs";
import {AuthenticatedResult} from "angular-auth-oidc-client/lib/auth-state/auth-result";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    private securityService: ISecurityService;
    private isAuthenticated$: Observable<AuthenticatedResult>;
    constructor(private configService: SecurityConfigService, private router: Router) {
    }

    ngOnInit(): void {
        this.configService
            .isAuthenticated()
            .pipe(filter(authenticated => authenticated))
            .subscribe(() => {
                this.router.navigate(['/dashboard']);
            });
    }
}
