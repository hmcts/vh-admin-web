import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { VersionService } from 'src/app/services/version.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit, OnDestroy {
    hideContactUsLink = false;
    sub!: Subscription;
    //private versionService = inject(VersionService);

    appVersion: string;

    constructor(private readonly router: Router, private readonly versionService: VersionService) {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(x => {
            this.hideContactUs();
        });
        this.sub = this.versionService.version$.subscribe(version => {
            this.appVersion = version.app_version;
        });
    }
    ngOnDestroy(): void {
       this.sub.unsubscribe();
    }

    ngOnInit() {
        this.hideContactUs();
    }

    hideContactUs() {
        this.hideContactUsLink = this.router.url === '/contact-us';
    }
}
