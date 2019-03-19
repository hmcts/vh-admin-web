import { Location } from '@angular/common';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';

import { routes } from './app-routing.module';
import { AppComponent } from './app.component';
import { CheckListComponent } from './check-list/check-list.component';
import { ChangesGuard } from './common/guards/changes.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './security/auth.gaurd';
import { AdminGuard } from './security/admin.guard';

import { LoginComponent } from './security/login.component';
import { LogoutComponent } from './security/logout.component';
import { MockAdalService } from './testing/mocks/MockAdalService';
import { MockChangesGuard } from './testing/mocks/MockChangesGuard';
import { ContactUsStubComponent } from './testing/stubs/contact-us-stub';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { HeaderStubComponent } from './testing/stubs/header-stub';
import { PaginationStubComponent } from './testing/stubs/pagination-stub';
import { UnauthorisedComponent } from './error/unauthorised.component';
import { ErrorComponent } from './error/error.component';
import { ErrorService } from './services/error.service';
import { SignOutPopupComponent } from './popups/sign-out-popup/sign-out-popup.component';
import { WaitPopupComponent } from './popups/wait-popup/wait-popup.component';
import { CancelPopupStubComponent } from './testing/stubs/cancel-popup-stub';
import { SaveFailedPopupComponent } from './popups/save-failed-popup/save-failed-popup.component';

describe('app routing', () => {
  let location: Location;
  let router: Router;
  let fixture: ComponentFixture<DashboardComponent>;
  let adalSvc;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule.withRoutes(routes), FormsModule],
      declarations: [
        DashboardComponent,
        AppComponent,
        LoginComponent,
        LogoutComponent,
        CheckListComponent,
        HeaderStubComponent,
        FooterStubComponent,
        ContactUsStubComponent,
        PaginationStubComponent,
        UnauthorisedComponent,
        ErrorComponent,
        SignOutPopupComponent,
        WaitPopupComponent,
        CancelPopupStubComponent,
        SaveFailedPopupComponent
      ],
      providers: [
        AuthGuard,
        AdminGuard,
        { provide: AdalService, useClass: MockAdalService },
        { provide: ChangesGuard, useClass: MockChangesGuard }, HttpClient, HttpHandler,
        ErrorService
      ],
    }).compileComponents();

    router = TestBed.get(Router);
    location = TestBed.get(Location);
    fixture = TestBed.createComponent(DashboardComponent);
    adalSvc = TestBed.get(AdalService);
  });

  describe('when logged in with successful authentication', () => {
    it('it should be able to navigate to dashboard successfully', fakeAsync(() => {
      adalSvc.setAuthenticated(true);
      router.navigate(['/dashboard']);
      tick();
      expect(location.path()).toBe('/dashboard');
    }));
  });

  describe('when log in failed with unsuccessful authentication', () => {
    it('it should navigate to login', fakeAsync(() => {
      adalSvc.setAuthenticated(false);
      router.navigate(['/dashboard']);
      tick();
      expect(location.path()).toBe('/login');
    }));
  });
});
