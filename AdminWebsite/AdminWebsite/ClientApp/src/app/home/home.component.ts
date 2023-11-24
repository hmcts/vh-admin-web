import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { VhOidcSecurityService } from '../security/vh-oidc-security.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    constructor(private oidcSecurityService: VhOidcSecurityService, private router: Router) {}

    ngOnInit(): void {
        this.oidcSecurityService
            .isAuthenticated()
            .pipe(filter(authenticated => authenticated))
            .subscribe(() => {
                this.router.navigate(['/dashboard']);
            });
    }
}
