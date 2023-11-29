import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IdpProviders, SecurityService } from './services/security.service';
import { PageUrls } from '../shared/page-url.constants';
@Component({
    selector: 'app-reform-login',
    templateUrl: './login.component.html'
})
export class ReformLoginComponent {
    constructor(private router: Router, private securityService: SecurityService) {
        this.securityService.currentIdpConfigId = IdpProviders.reform;
        this.router.navigate([`/${PageUrls.Login}`]);
    }
}
