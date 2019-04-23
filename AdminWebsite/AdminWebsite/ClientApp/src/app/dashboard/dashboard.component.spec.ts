import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserIdentityService } from '../services/user-identity.service';
import { DashboardComponent } from './dashboard.component';
import { UserProfileResponse } from '../services/clients/api-client';
import { of, throwError } from 'rxjs';
import { ErrorService } from 'src/app/services/error.service';
import { PageUrls } from '../shared/page-url.constants';
import { Router } from '@angular/router';

const userProfileResponse: UserProfileResponse = new UserProfileResponse();
class UserIdentityServiceSpy {
  getUserInformation() {
    userProfileResponse.is_case_administrator = true;
    userProfileResponse.is_vh_officer_administrator_role = true;
    return of(userProfileResponse);
  }
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  const errorServiceSpy: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);
  const userIdentitySpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['getUserInformation']);
  let routerSpy: jasmine.SpyObj<Router>;
  routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  routerSpy.navigate.and.callFake(() => { });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [DashboardComponent],
      providers: [
        { provide: UserIdentityService, useValue: userIdentitySpy },
        { provide: ErrorService, useValue: errorServiceSpy },
        { provide: Router, useValue: routerSpy },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should show for VH officer checklist', async () => {
    userIdentitySpy.getUserInformation.and.returnValue(of(new UserProfileResponse({
      is_case_administrator: false,
      is_vh_officer_administrator_role: true
    })));
    await component.ngOnInit();
    expect(component.showCheckList).toBeTruthy();
  });

  it('should show for VH officer and case admin booking', async () => {
    userIdentitySpy.getUserInformation.and.returnValue(of(new UserProfileResponse({
      is_case_administrator: true,
      is_vh_officer_administrator_role: true
    })));
    await component.ngOnInit();
    expect(component.showBooking).toBeTruthy();
  });
});
