import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SecurityService } from '../security/services/security.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    constructor(private readonly securityService: SecurityService, private readonly router: Router) {}

    ngOnInit(): void {
        this.securityService
            .isAuthenticated()
            .pipe(filter(authenticated => authenticated))
            .subscribe(() => {
                this.router.navigate(['/dashboard']);
            });
    }
}
