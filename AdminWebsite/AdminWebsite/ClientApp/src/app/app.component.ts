import { Component, OnInit, ViewChild, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConfigService } from './services/config.service';
import { PageTrackerService } from './services/page-tracker.service';
import { WindowRef } from './security/window-ref';
import { HeaderComponent } from './shared/header/header.component';
import { VideoHearingsService } from './services/video-hearings.service';
import { BookingService } from './services/booking.service';
import { DeviceType } from './services/device-type';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

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
 constructor(private adalSvc: AdalService,
    private configService: ConfigService,
    private router: Router,
    private window: WindowRef,
    pageTracker: PageTrackerService,
    private videoHearingsService: VideoHearingsService,
    private bookingService: BookingService, private deviceTypeService: DeviceType) {

    this.config.tenant = this.configService.clientSettings.tenant_id;
    this.config.clientId = this.configService.clientSettings.client_id;
    this.config.redirectUri = this.configService.clientSettings.redirect_uri;
    this.config.postLogoutRedirectUri = this.configService.clientSettings.post_logout_redirect_uri;
    this.adalSvc.init(this.config);

    pageTracker.trackNavigation(router);
    pageTracker.trackPreviousPage(router);
  }

  ngOnInit() {
    this.checkBrowser();
    const currentUrl = this.window.getLocation().href;
    this.adalSvc.handleWindowCallback();
    this.loggedIn = this.adalSvc.userInfo.authenticated;

    if (!this.loggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
    }
    this.headerComponent.confirmLogout.subscribe(() => { this.showConfirmation(); });
    this.headerComponent.confirmSaveBooking.subscribe((menuItemIndex) => { this.showConfirmationSaveBooking(menuItemIndex); });
  }

  onActivate(event) {
    window.scroll(0, 0);
  }

  showConfirmation() {
    if (this.videoHearingsService.hasUnsavedChanges()) {
      this.showSignOutConfirmation = true;
    } else {
      this.handleSignOut();
    }
  }

  showConfirmationSaveBooking(menuItemIndex) {
    this.menuItemIndex = menuItemIndex;
    if (this.videoHearingsService.hasUnsavedChanges()) {
      this.showSaveConfirmation = true;
    } else {
      this.videoHearingsService.cancelRequest();
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
    this.router.navigate(['/logout']);
  }

  handleNavigate() {
    this.showSaveConfirmation = false;
    this.videoHearingsService.cancelRequest();
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
}
