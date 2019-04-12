import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserIdentityService } from '../services/user-identity.service';
import { DashboardComponent } from './dashboard.component';
import { UserProfileResponse } from '../services/clients/api-client';
import { of } from 'rxjs';
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
  const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);
  let routerSpy: jasmine.SpyObj<Router>;
  routerSpy = jasmine.createSpyObj('Router', ['navigate']);

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [DashboardComponent],
      providers: [
        { provide: UserIdentityService, useClass: UserIdentityServiceSpy },
        { provide: ErrorService, useValue: errorService },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show for VH officer checklist', async () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.showCheckList).toBeTruthy();
  });

  it('should show for VH officer and case admin booking', async () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.showBooking).toBeTruthy();
  });
});
