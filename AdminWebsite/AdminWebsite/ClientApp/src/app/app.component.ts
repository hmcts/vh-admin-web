import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PageTrackerService } from './services/page-tracker.service';
import { WindowRef } from './security/window-ref';
import { HeaderComponent } from './shared/header/header.component';
import { VideoHearingsService } from './services/video-hearings.service';
import { BookingService } from './services/booking.service';
import { DeviceType } from './services/device-type';
import { ConnectionService } from './services/connection/connection.service';
import { IdpProviders, VhOidcSecurityService } from './security/vh-oidc-security.service';
import { AuthStateResult, EventTypes, OidcClientNotification, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs';
import { Logger } from './services/logger';

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
        private oidcSecurityService: VhOidcSecurityService,
        private eventService: PublicEventsService,
        private router: Router,
        private window: WindowRef,
        pageTracker: PageTrackerService,
        private videoHearingsService: VideoHearingsService,
        private bookingService: BookingService,
        private deviceTypeService: DeviceType,
        connection: ConnectionService,
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

        this.oidcSecurityService.checkAuthMultiple().subscribe(response => {
            if (response.find(x => x.configId === this.oidcSecurityService.getIdp() && x.isAuthenticated)) {
                this.loggedIn = true;
            }
            // remove this because the auth guard will take care of the access

            // if (!this.loggedIn && this.oidcSecurityService.getIdp() === IdpProviders.dom1) {
            //     this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
            //     return;
            // }

            // if (!this.loggedIn && this.oidcSecurityService.getIdp() === IdpProviders.vhaad) {
            //     this.router.navigate(['/login-reform'], { queryParams: { returnUrl: currentUrl } });
            //     return;
            // }

            // wait for the callback to complete and then check if the user is authenticated
            this.eventService
                .registerForEvents()
                .pipe(filter(notification => notification.type === EventTypes.NewAuthenticationResult))
                .subscribe(async (value: OidcClientNotification<AuthStateResult>) => {
                    this.logger.debug('[AppComponent] - OidcClientNotification event received with value ', value);
                    const auth = response.find(x => x.configId === this.oidcSecurityService.getIdp());
                    this.loggedIn = auth.isAuthenticated;
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
