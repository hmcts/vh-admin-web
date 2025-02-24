import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { VersionService } from 'src/app/services/version.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {
    hideContactUsLink = false;
    private versionService = inject(VersionService);

    appVersion = this.versionService.appVersion;
    
    constructor(private readonly router: Router) {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(x => {
            this.hideContactUs();
        });
    }

    ngOnInit() {
        this.hideContactUs();
    }

    hideContactUs() {
        this.hideContactUsLink = this.router.url === '/contact-us';
    }
}
