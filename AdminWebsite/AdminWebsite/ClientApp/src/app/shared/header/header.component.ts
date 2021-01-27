import { Component, OnInit, EventEmitter, ViewChild, Input, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { ConnectionService } from 'src/app/services/connection.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent {
    @Input() loggedIn: boolean;

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
            name: 'Bookings list',
            active: false
        }
    ];

    isSticky = false;

    constructor(private router: Router, private connection: ConnectionService) {
        this.$confirmLogout = new EventEmitter();
        this.$confirmSaveBooking = new EventEmitter();
        this.showMenuItems$ = this.connection.hasConnection$.pipe(startWith(true));
    }

    @HostListener('window:scroll', ['$event'])
    checkScroll() {
        this.isSticky = window.pageYOffset > this.headerElement.nativeElement.offsetTop;
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
