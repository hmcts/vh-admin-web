import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConfigService } from './services/config.service';
import { PageTrackerService } from './services/page-tracker.service';
import { WindowRef } from './security/window-ref';
import { HeaderComponent } from './shared/header/header.component';
import { VideoHearingsService } from './services/video-hearings.service';


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

  @ViewChild(HeaderComponent)
  headerComponent: HeaderComponent;

  showSignOutConfirmation: boolean = false;

  title = 'Book hearing';
  loggedIn: boolean;
  constructor(private adalSvc: AdalService,
    private configService: ConfigService,
    private router: Router,
    private window: WindowRef,
    pageTracker: PageTrackerService,private videoHearingsService: VideoHearingsService ) {
    this.config.tenant = this.configService.clientSettings.tenant_id;
    this.config.clientId = this.configService.clientSettings.client_id;
    this.config.redirectUri = this.configService.clientSettings.redirect_uri;
    this.config.postLogoutRedirectUri = this.configService.clientSettings.post_logout_redirect_uri;
    this.adalSvc.init(this.config);

    pageTracker.trackNavigation(router);
    pageTracker.trackPreviousPage(router);
  }

  ngOnInit() {
    const currentUrl = this.window.getLocation().href;
    this.adalSvc.handleWindowCallback();
    this.loggedIn = this.adalSvc.userInfo.authenticated;

    if (!this.loggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
    }

    this.headerComponent.confirmLogout.subscribe(() => { this.showConfirmation(); });
  }

  showConfirmation() {
    if (this.videoHearingsService.hasUnsavedChanges()) {
      this.showSignOutConfirmation = true;
    } else {
      this.handleSignOut();
    }
  }

  handleContinue() {
    this.showSignOutConfirmation = false;
  }

  handleSignOut() {
    this.showSignOutConfirmation = false;
    this.router.navigate(['/logout']);
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
