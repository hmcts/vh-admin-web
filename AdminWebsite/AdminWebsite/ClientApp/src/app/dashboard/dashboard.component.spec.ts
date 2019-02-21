import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserIdentityService } from '../services/user-identity.service';
import { DashboardComponent } from './dashboard.component';
import { UserProfileResponse } from '../services/clients/api-client';
import { of } from 'rxjs';

let userProfileResponse: UserProfileResponse = new UserProfileResponse();

class userIdentityServiceSpy {
  getUserInformation() {
    userProfileResponse.is_case_administrator = true;
    userProfileResponse.is_vh_officer_administrator_role = true;
    return of(userProfileResponse);
  }
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [DashboardComponent],
      providers: [{ provide: UserIdentityService, useClass: userIdentityServiceSpy }]
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
  it('should show for VH officer abd case admin booking', async () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.showBooking).toBeTruthy();

  });

});
