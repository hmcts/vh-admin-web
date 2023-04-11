import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

    ngOnInit(): void {
        this.oidcSecurityService.isAuthenticated$.pipe(filter(auth => auth.isAuthenticated)).subscribe(() => {
            this.router.navigate(['/dashboard']);
        });
    }
}
