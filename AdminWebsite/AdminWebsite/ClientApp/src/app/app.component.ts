import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PageTrackerService } from './services/page-tracker.service';
import { HeaderComponent } from './shared/header/header.component';
import { VideoHearingsService } from './services/video-hearings.service';
import { BookingService } from './services/booking.service';
import { DeviceType } from './services/device-type';
import { ConnectionService } from './services/connection/connection.service';
import { SecurityService } from './security/services/security.service';
import { ConfigService } from './services/config.service';
import { first } from 'rxjs';
import { DynatraceService } from './services/dynatrace.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
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
    username: string;
    menuItemIndex: number;

    constructor(
        private readonly securityService: SecurityService,
        private readonly router: Router,
        pageTracker: PageTrackerService,
        private readonly videoHearingsService: VideoHearingsService,
        private readonly bookingService: BookingService,
        private readonly deviceTypeService: DeviceType,
        private readonly configService: ConfigService,
        private readonly dynatraceService: DynatraceService,
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

        this.configService
            .getClientSettings()
            .pipe(first())
            .subscribe({
                next: clientSettings => {
                    this.dynatraceService.addDynatraceScript(clientSettings.dynatrace_rum_link);
                }
            });

        this.securityService.checkAuthMultiple().subscribe(response => {
            const user = response.find(x => x.configId === this.securityService.currentIdpConfigId && x.isAuthenticated);

            if (user) {
                this.loggedIn = true;
                this.username = user.userData?.preferred_username?.toLowerCase();

                /* The line
                `this.dynatraceService.addUserIdentifyScript(userData?.preferred_username?.toLowerCase());`
                is calling a method `addUserIdentifyScript` from the `dynatraceService`
                service. This method is used to identify the user in Dynatrace
                monitoring by passing the user's preferred username in lowercase as a
                parameter.*/
                this.dynatraceService.addUserIdentifyScript(this.username);
            }
        });

        this.headerComponent.confirmLogout.subscribe(() => {
            this.showConfirmation();
        });

        this.headerComponent.confirmSaveBooking.subscribe(menuItemIndex => {
            this.showConfirmationSave(menuItemIndex);
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
