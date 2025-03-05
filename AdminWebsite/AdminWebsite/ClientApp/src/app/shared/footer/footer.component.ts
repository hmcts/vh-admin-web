import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { VersionService } from 'src/app/services/version.service';

@Component({
    selector: 'app-footer',
    styleUrls: ['./footer.component.scss'],
    templateUrl: './footer.component.html',
    standalone: false
})
export class FooterComponent implements OnInit, OnDestroy {
    hideContactUsLink = false;
    destroyed$ = new Subject<void>();

    appVersion: string;

    constructor(
        private readonly router: Router,
        private readonly versionService: VersionService
    ) {
        this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                takeUntil(this.destroyed$)
            )
            .subscribe(x => {
                this.hideContactUs();
            });
        this.versionService.version$.pipe(takeUntil(this.destroyed$)).subscribe(version => {
            this.appVersion = version.app_version;
        });
    }
    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    ngOnInit() {
        this.hideContactUs();
    }

    hideContactUs() {
        this.hideContactUsLink = this.router.url === '/contact-us';
    }
}
