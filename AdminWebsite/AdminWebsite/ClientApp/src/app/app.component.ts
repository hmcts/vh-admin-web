import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PageTrackerService } from './services/page-tracker.service';
import { HeaderComponent } from './shared/header/header.component';
import { VideoHearingsService } from './services/video-hearings.service';
import { BookingService } from './services/booking.service';
import { DeviceType } from './services/device-type';
import { ConnectionService } from './services/connection/connection.service';
import { AuthStateResult, EventTypes, OidcClientNotification, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';
import { Logger } from './services/logger';
import { SecurityService } from './security/services/security.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    @ViewChild('maincontent', { static: true })
    main: ElementRef;

    @ViewChild(HeaderComponent, { static: true })
    headerComponent: HeaderComponent;

    showSignOutConfirmation = false;
    showSaveConfirmation = false;
    title = 'Book hearing';
    loggedIn: boolean;
    menuItemIndex: number;
    constructor(
        private securityService: SecurityService,
        private router: Router,
        pageTracker: PageTrackerService,
        private videoHearingsService: VideoHearingsService,
        private bookingService: BookingService,
        private deviceTypeService: DeviceType,
        connection: ConnectionService,
        private eventService: PublicEventsService,
        private logger: Logger
    ) {
        pageTracker.trackNavigation(router);
        pageTracker.trackPreviousPage(router);
        connection.hasConnection$.subscribe(connectionStatus => {
            if (!connectionStatus) {
                this.router.navigate(['/error']);
            }
        });
    }

    ngOnInit() {
        this.checkBrowser();

        this.securityService.checkAuthMultiple().subscribe(response => {
            if (response.find(x => x.configId === this.securityService.currentIdpConfigId && x.isAuthenticated)) {
                this.loggedIn = true;
            }
            this.eventService
                .registerForEvents()
                .pipe(filter(notification => notification.type === EventTypes.NewAuthenticationResult))
                .subscribe(async (value: OidcClientNotification<AuthStateResult>) => {
                    this.logger.debug('[AppComponent] - OidcClientNotification event received with value ', value);
                    this.loggedIn = response.find(x => x.configId === this.securityService.currentIdpConfigId).isAuthenticated;
                });

            this.headerComponent.confirmLogout.subscribe(() => {
                this.showConfirmation();
            });

            this.headerComponent.confirmSaveBooking.subscribe(menuItemIndex => {
                this.showConfirmationSave(menuItemIndex);
            });
        });
    }

    onActivate(event) {
        window.scroll(0, 0);
    }

    showConfirmation() {
        if (this.videoHearingsService.hasUnsavedChanges() || this.videoHearingsService.hasUnsavedVhoNonAvailabilityChanges()) {
            this.showSignOutConfirmation = true;
        } else {
            this.handleSignOut();
        }
    }

    showConfirmationSave(menuItemIndex) {
        this.menuItemIndex = menuItemIndex;
        if (this.videoHearingsService.hasUnsavedChanges() || this.videoHearingsService.hasUnsavedVhoNonAvailabilityChanges()) {
            this.showSaveConfirmation = true;
        } else {
            this.videoHearingsService.cancelRequest();
            this.videoHearingsService.cancelVhoNonAvailabiltiesRequest();
            this.bookingService.resetEditMode();
            this.headerComponent.navigateToSelectedMenuItem(menuItemIndex);
        }
    }

    handleContinue() {
        this.showSignOutConfirmation = false;
        this.showSaveConfirmation = false;
    }

    handleSignOut() {
        this.showSignOutConfirmation = false;
        this.videoHearingsService.cancelRequest();
        this.videoHearingsService.cancelVhoNonAvailabiltiesRequest();
        this.router.navigate(['/logout']);
    }

    handleNavigate() {
        this.showSaveConfirmation = false;
        this.videoHearingsService.cancelRequest();
        this.videoHearingsService.cancelVhoNonAvailabiltiesRequest();
        this.headerComponent.navigateToSelectedMenuItem(this.menuItemIndex);
    }

    checkBrowser(): void {
        if (!this.deviceTypeService.isSupportedBrowser()) {
            this.router.navigateByUrl('unsupported-browser');
        }
    }

    @HostListener('window:beforeunload', ['$event'])
    public beforeunloadHandler($event: any) {
        if (this.videoHearingsService.hasUnsavedChanges()) {
            // show default confirmation pop up of browser to leave page.
            $event.preventDefault();
            // return value should not be empty to show browser leave pop up
            $event.returnValue = 'save';
        }
    }

    skipToContent() {
        this.main.nativeElement.focus();
    }
}
