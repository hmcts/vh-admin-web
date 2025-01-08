import { Component, EventEmitter, ViewChild, Input, ElementRef, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Observable } from 'rxjs';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
    @Input() loggedIn: boolean;
    @Input() username: string;

    @ViewChild('headerElement', { static: true })
    headerElement: ElementRef;

    $confirmLogout: EventEmitter<any>;
    $confirmSaveBooking: EventEmitter<any>;

    showMenuItems$ = new Observable();

    topMenuItems = [
        {
            url: '/dashboard',
            name: 'Dashboard',
            active: false
        },
        {
            url: '/bookings-list',
            name: 'Booking list',
            active: false
        }
    ];

    constructor(private readonly router: Router) {
        this.$confirmLogout = new EventEmitter();
        this.$confirmSaveBooking = new EventEmitter();
    }

    ngOnInit() {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
            this.updateActiveMenuItem(this.router.url);
        });
    }

    updateActiveMenuItem(currentUrl: string) {
        this.topMenuItems.forEach(item => {
            item.active = item.url === currentUrl;
        });
    }

    selectMenuItem(indexOfItem: number) {
        // confirmation to save a booking changes before navigate away.
        this.$confirmSaveBooking.emit(indexOfItem);
    }

    navigateToSelectedMenuItem(indexOfItem: number) {
        for (const item of this.topMenuItems) {
            item.active = false;
        }
        this.topMenuItems[indexOfItem].active = true;
        this.router.navigate([this.topMenuItems[indexOfItem].url]);
    }

    logout() {
        this.$confirmLogout.emit();
    }

    get confirmLogout() {
        return this.$confirmLogout;
    }

    get confirmSaveBooking() {
        return this.$confirmSaveBooking;
    }
}
