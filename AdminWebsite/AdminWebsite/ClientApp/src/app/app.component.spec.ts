import { HttpClient, HttpClientModule } from '@angular/common/http';
import { fakeAsync, inject, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { of, throwError } from 'rxjs';
import { AppComponent } from './app.component';
import { WindowLocation, WindowRef } from './security/window-ref';
import { ClientSettingsResponse } from './services/clients/api-client';
import { ConfigService } from './services/config.service';
import { ConnectionServiceConfigToken } from './services/connection/connection';
import { ConnectionService } from './services/connection/connection.service';
import { DeviceType } from './services/device-type';
import { PageTrackerService } from './services/page-tracker.service';
import { VideoHearingsService } from './services/video-hearings.service';
import { HeaderComponent } from './shared/header/header.component';
import { UnsupportedBrowserComponent } from './shared/unsupported-browser/unsupported-browser.component';
import { MockOidcSecurityService } from './testing/mocks/MockOidcSecurityService';
import { CancelPopupStubComponent } from './testing/stubs/cancel-popup-stub';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { SignOutPopupStubComponent } from './testing/stubs/sign-out-popup-stub';

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
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;

    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/dashboard',
        redirect_uri: '/dashboard'
    });

    let httpClient: jasmine.SpyObj<HttpClient>;

    const mockConnectionService = {
        hasConnection$: {
            subscribe: () => of(null),
            pipe: () => of(null)
        }
    };

    beforeEach(waitForAsync(() => {
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings', 'loadConfig']);
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettings));
        oidcSecurityService = mockOidcSecurityService;

        window = jasmine.createSpyObj('WindowRef', ['getLocation']);
        window.getLocation.and.returnValue(new WindowLocation('/url'));

        pageTracker = jasmine.createSpyObj('PageTrackerService', ['trackNavigation', 'trackPreviousPage']);

        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceType>(['isSupportedBrowser']);

        httpClient = jasmine.createSpyObj<HttpClient>(['head']);
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            declarations: [
                AppComponent,
                HeaderComponent,
                FooterStubComponent,
                SignOutPopupStubComponent,
                CancelPopupStubComponent,
                UnsupportedBrowserComponent
            ],
            providers: [
                { provide: OidcSecurityService, useValue: mockOidcSecurityService },
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: Router, useValue: router },
                { provide: PageTrackerService, useValue: pageTracker },
                { provide: WindowRef, useValue: window },
                { provide: VideoHearingsService, useValue: videoHearingServiceSpy },
                { provide: DeviceType, useValue: deviceTypeServiceSpy },
                { provide: ConnectionService, useFactory: () => mockConnectionService }
            ]
        }).compileComponents();
    }));
    it('should create the app', waitForAsync(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    }));
    it(`should have as title 'Book hearing'`, waitForAsync(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app.title).toEqual('Book hearing');
    }));
    it('should a tag Skip to main content', waitForAsync(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('a').textContent).toContain('Skip to main content');
    }));

    it('should redirect to login with current url as return url if not authenticated', fakeAsync(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        mockOidcSecurityService.setAuthenticated(false);
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

describe('AppComponent - ConnectionService', () => {
    const router = {
        navigate: jasmine.createSpy('navigate'),
        navigateByUrl: jasmine.createSpy('navigateByUrl')
    };

    const videoHearingServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
        'hasUnsavedChanges',
        'hasUnsavedVhoNonAvailabilityChanges',
        'cancelVhoNonAvailabiltiesRequest',
        'cancelRequest'
    ]);

    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let pageTracker: jasmine.SpyObj<PageTrackerService>;
    let window: jasmine.SpyObj<WindowRef>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceType>;
    let mockOidcSecurityService: MockOidcSecurityService;
    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/dashboard',
        redirect_uri: '/dashboard'
    });

    let httpClient: jasmine.SpyObj<HttpClient>;

    beforeEach(waitForAsync(() => {
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings', 'loadConfig']);
        mockOidcSecurityService = new MockOidcSecurityService();

        window = jasmine.createSpyObj('WindowRef', ['getLocation']);
        window.getLocation.and.returnValue(new WindowLocation('/url'));

        pageTracker = jasmine.createSpyObj('PageTrackerService', ['trackNavigation', 'trackPreviousPage']);

        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceType>(['isSupportedBrowser']);

        httpClient = jasmine.createSpyObj<HttpClient>(['head']);

        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            declarations: [
                AppComponent,
                HeaderComponent,
                FooterStubComponent,
                SignOutPopupStubComponent,
                CancelPopupStubComponent,
                UnsupportedBrowserComponent
            ],
            providers: [
                { provide: OidcSecurityService, useValue: mockOidcSecurityService },
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: Router, useValue: router },
                { provide: PageTrackerService, useValue: pageTracker },
                { provide: WindowRef, useValue: window },
                { provide: VideoHearingsService, useValue: videoHearingServiceSpy },
                { provide: DeviceType, useValue: deviceTypeServiceSpy },
                { provide: ConnectionServiceConfigToken, useValue: { interval: 1000 } }
            ]
        }).compileComponents();
        videoHearingServiceSpy.cancelVhoNonAvailabiltiesRequest.calls.reset();
    }));

    it('should redirect if the connection is lost', fakeAsync(
        inject([HttpClient], (http: HttpClient) => {
            const service = TestBed.inject(ConnectionService);

            // make sure the observable from head errors
            spyOn(http, 'head').and.returnValue(throwError);

            // need this to start the timer in the async zone
            tick(0);

            expect(http.head).toHaveBeenCalledTimes(1);

            TestBed.createComponent(AppComponent);

            expect(router.navigate).toHaveBeenCalled();

            const lastRouterCall = router.navigate.calls.mostRecent();
            const url = lastRouterCall.args[0][0];
            expect(url).toEqual('/error');
        })
    ));

    it('should popup if work allocation data changed', () => {
        const fixture = TestBed.createComponent(AppComponent);
        videoHearingServiceSpy.hasUnsavedVhoNonAvailabilityChanges.and.returnValue(true);
        const component = fixture.componentInstance;
        component.showConfirmationSave(1);
        expect(component.showSaveConfirmation).toBeTruthy();
    });

    it('should popup if work allocation data not changed', () => {
        const fixture = TestBed.createComponent(AppComponent);
        videoHearingServiceSpy.hasUnsavedVhoNonAvailabilityChanges.and.returnValue(false);
        const component = fixture.componentInstance;
        component.showConfirmationSave(1);
        expect(videoHearingServiceSpy.cancelVhoNonAvailabiltiesRequest).toHaveBeenCalledTimes(1);
    });

    it('should cancel flag when handleSignOut is called', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const component = fixture.componentInstance;
        component.handleSignOut();
        expect(videoHearingServiceSpy.cancelVhoNonAvailabiltiesRequest).toHaveBeenCalledTimes(1);
    });
});
