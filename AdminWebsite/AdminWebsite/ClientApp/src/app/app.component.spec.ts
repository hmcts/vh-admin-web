import { HttpClientModule } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { Component, EventEmitter } from '@angular/core';

import { AppComponent } from './app.component';
import { ClientSettingsResponse } from './services/clients/api-client';
import { ConfigService } from './services/config.service';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { SignOutPopupStubComponent } from './testing/stubs/sign-out-popup-stub';
import { VideoHearingsService } from './services/video-hearings.service';

@Component({ selector: 'app-header', template: '' })
export class HeaderComponent {
  $confirmLogout: EventEmitter<any> = new EventEmitter();
  get confirmLogout() {
    return this.$confirmLogout;
  }
}

describe('AppComponent', () => {
  const router = {
    navigate: jasmine.createSpy('navigate')
  };

  const videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingsService', ['hasUnsavedChanges']);

  let configServiceSpy: jasmine.SpyObj<ConfigService>;
  let adalServiceSpy: jasmine.SpyObj<AdalService>;

  const clientSettings = new ClientSettingsResponse({
    tenant_id: 'tenantid',
    client_id: 'clientid',
    post_logout_redirect_uri: '/dashboard',
    redirect_uri: '/dashboard'
  });

  const userInfo = {
    authenticated: false,
    userName: 'test@automated.com',
    token: 'token'
  };

  beforeEach(async(() => {
    configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['clientSettings', 'getClientSettings', 'loadConfig']);
    configServiceSpy.clientSettings.and.returnValue(clientSettings);

    adalServiceSpy = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo']);
    adalServiceSpy.userInfo.and.returnValue(userInfo);
    TestBed.configureTestingModule({
      imports: [HttpClientModule, RouterTestingModule],
      declarations: [
        AppComponent,
        HeaderComponent,
        FooterStubComponent,
        SignOutPopupStubComponent,
      ],
      providers:
        [
          { provide: AdalService, useValue: adalServiceSpy },
          { provide: ConfigService, useValue: configServiceSpy },
          { provide: Router, useValue: router },
          { provide: VideoHearingsService, useValue: videoHearingServiceSpy }

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
});
