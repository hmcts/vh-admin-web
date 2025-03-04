import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    standalone: false
})
export class FooterComponent implements OnInit {
    hideContactUsLink = false;

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
