import { Component } from '@angular/core';
import { IdpProviders, VhOidcSecurityService } from '../vh-oidc-security.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Router } from '@angular/router';

@Component({
    selector: 'app-reform-login',
    templateUrl: './reform-login.component.html'
})
export class ReformLoginComponent {
    constructor(private router: Router, private oidcSecurityService: VhOidcSecurityService) {
        this.oidcSecurityService.setIdp(IdpProviders.vhaad);
        this.router.navigate([`/${PageUrls.Login}`]);
    }
}
