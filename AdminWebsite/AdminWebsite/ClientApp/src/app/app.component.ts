import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from './services/config.service';
import { PageTrackerService } from './services/page-tracker.service';
import { WindowRef } from './security/window-ref';
import { HeaderComponent } from './shared/header/header.component';
import { VideoHearingsService } from './services/video-hearings.service';
import { BookingService } from './services/booking.service';
import { DeviceType } from './services/device-type';
import { ConnectionService } from './services/connection/connection.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    @ViewChild('maincontent', { static: true })
    main: ElementRef;

    private config = {
        tenant: '',
        clientId: '',
        redirectUri: '',
        postLogoutRedirectUri: ''
    };

    @ViewChild(HeaderComponent, { static: true })
    headerComponent: HeaderComponent;

    showSignOutConfirmation = false;
    showSaveConfirmation = false;
    title = 'Book hearing';
    loggedIn: boolean;
    menuItemIndex: number;
    constructor(
        private oidcSecurityService: OidcSecurityService,
        private configService: ConfigService,
        private router: Router,
        private window: WindowRef,
        pageTracker: PageTrackerService,
        private videoHearingsService: VideoHearingsService,
        private bookingService: BookingService,
        private deviceTypeService: DeviceType,
        connection: ConnectionService
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
        const currentUrl = this.window.getLocation().href;
        this.configService.getClientSettings().subscribe(clientSettings => {
            this.oidcSecurityService.checkAuth().subscribe(response => {
                this.loggedIn = response.isAuthenticated;
                if (!this.loggedIn) {
                    this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
                    return;
                }

                this.headerComponent.confirmLogout.subscribe(() => {
                    this.showConfirmation();
                });
                this.headerComponent.confirmSaveBooking.subscribe(menuItemIndex => {
                    this.showConfirmationSave(menuItemIndex);
                });
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
