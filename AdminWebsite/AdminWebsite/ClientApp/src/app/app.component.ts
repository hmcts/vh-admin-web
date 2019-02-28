import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';

import { ConfigService } from './services/config.service';
import { PageTrackerService } from './services/page-tracker.service';
import { WindowRef } from './security/window-ref';

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

  title = 'Book hearing';
  loggedIn: boolean;
  constructor(private adalSvc: AdalService,
    private configService: ConfigService,
    private router: Router,
    private window: WindowRef,
    pageTracker: PageTrackerService) {
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
  }

  logOut() {
    this.loggedIn = false;
    sessionStorage.clear();
    this.adalSvc.logOut();
  }
}
