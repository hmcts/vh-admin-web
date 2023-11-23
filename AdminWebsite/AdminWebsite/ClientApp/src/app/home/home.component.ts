import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import {SecurityConfigService} from "../security/services/security-config.service";
import {ISecurityService} from "../security/services/security-service.interface";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    private currentIdp: string;
    private securityService: ISecurityService;
    constructor(private configService: SecurityConfigService, private router: Router) {
        this.configService.currentIdpConfigId$.subscribe(idp => {
            this.currentIdp = idp;
        });
        this.securityService = this.configService.getSecurityService();
    }
    ngOnInit(): void {
        this.securityService.isAuthenticated(this.currentIdp).pipe(filter(Boolean)).subscribe(() => {
            this.router.navigate(['/dashboard']);
        });
    }
}
