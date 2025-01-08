import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IdpProviders, SecurityService } from './services/security.service';
import { PageUrls } from '../shared/page-url.constants';
@Component({
    selector: 'app-reform-login',
    templateUrl: './login.component.html'
})
export class ReformLoginComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly securityService: SecurityService
    ) {
        this.securityService.currentIdpConfigId = IdpProviders.reform;
    }

    ngOnInit(): void {
        this.router.navigate([`/${PageUrls.Login}`]);
    }
}
