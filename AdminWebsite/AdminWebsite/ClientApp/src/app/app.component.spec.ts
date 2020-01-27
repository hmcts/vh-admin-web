import { HttpClientModule } from '@angular/common/http';
import { async, TestBed, fakeAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';

import { AppComponent } from './app.component';
import { ClientSettingsResponse } from './services/clients/api-client';
import { ConfigService } from './services/config.service';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { SignOutPopupStubComponent } from './testing/stubs/sign-out-popup-stub';
import { PageTrackerService } from './services/page-tracker.service';
import { WindowRef, WindowLocation } from './security/window-ref';
import { VideoHearingsService } from './services/video-hearings.service';
import { CancelPopupStubComponent } from './testing/stubs/cancel-popup-stub';
import { HeaderComponent } from './shared/header/header.component';
import { UnsupportedBrowserComponent } from './shared/unsupported-browser/unsupported-browser.component';
import { DeviceType } from './services/device-type';


const adalService = {
  init: jasmine.createSpy('init'),
  handleWindowCallback: jasmine.createSpy('handleWindowCallback'),
  userInfo: jasmine.createSpy('userInfo')
};

describe('AppComponent', () => {
  const router = {
    navigate: jasmine.createSpy('navigate'),
    navigateByUrl: jasmine.createSpy('navigateByUrl')
  };

  const videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingsService', ['hasUnsavedChanges']);

  let configServiceSpy: jasmine.SpyObj<ConfigService>;
  let pageTracker: jasmine.SpyObj<PageTrackerService>;
  let window: jasmine.SpyObj<WindowRef>;
  let deviceTypeServiceSpy: jasmine.SpyObj<DeviceType>;

  const clientSettings = new ClientSettingsResponse({
    tenant_id: 'tenantid',
    client_id: 'clientid',
    post_logout_redirect_uri: '/dashboard',
    redirect_uri: '/dashboard'
  });

  beforeEach(async(() => {
    configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['clientSettings', 'getClientSettings', 'loadConfig']);
    configServiceSpy.clientSettings = clientSettings;

    window = jasmine.createSpyObj('WindowRef', ['getLocation']);
    window.getLocation.and.returnValue(new WindowLocation('/url'));

    pageTracker = jasmine.createSpyObj('PageTrackerService', ['trackNavigation', 'trackPreviousPage']);

    deviceTypeServiceSpy = jasmine.createSpyObj<DeviceType>(['isSupportedBrowser']);

    TestBed.configureTestingModule({
      imports: [HttpClientModule, RouterTestingModule],
      declarations: [
        AppComponent,
        HeaderComponent,
        FooterStubComponent,
        SignOutPopupStubComponent,
        CancelPopupStubComponent,
        UnsupportedBrowserComponent,
      ],
      providers:
        [
          { provide: AdalService, useValue: adalService },
          { provide: ConfigService, useValue: configServiceSpy },
          { provide: Router, useValue: router },
          { provide: PageTrackerService, useValue: pageTracker },
          { provide: WindowRef, useValue: window },
          { provide: VideoHearingsService, useValue: videoHearingServiceSpy },
          { provide: DeviceType, useValue: deviceTypeServiceSpy }
        ],
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should have as title 'Book hearing'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Book hearing');
  }));
  it('should a tag Skip to main content', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('a').textContent).toContain('Skip to main content');
  }));

  it('should redirect to login with current url as return url if not authenticated', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    adalService.userInfo.and.returnValue({ authenticated: false });
    window.getLocation.and.returnValue(new WindowLocation('/url', '?search', '#hash'));

    component.ngOnInit();

    const lastRouterCall = router.navigate.calls.mostRecent();
    const lastRoutingArgs = {
      url: lastRouterCall.args[0][0],
      queryParams: lastRouterCall.args[1].queryParams
    };
    expect(lastRoutingArgs.url).toEqual('/login');
    expect(lastRoutingArgs.queryParams.returnUrl).toEqual('/url?search#hash');
  }));

  it('should navigate to unsupported browser page if browser is not compatible', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(false);
    component.checkBrowser();
    expect(router.navigateByUrl).toHaveBeenCalledWith('unsupported-browser');
  });
});

