import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    const userIdentitySpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['getUserInformation']);

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [RouterTestingModule],
                declarations: [DashboardComponent],
                providers: [{ provide: UserIdentityService, useValue: userIdentitySpy }]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
    });

    it('should show for VH officer checklist', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_case_administrator: false,
                    is_vh_officer_administrator_role: true
                })
            )
        );
        await component.ngOnInit();
        expect(component.showCheckList).toBeTruthy();
    });

    it('should show for VH officer and case admin booking', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_case_administrator: true,
                    is_vh_officer_administrator_role: true
                })
            )
        );
        await component.ngOnInit();
        expect(component.showBooking).toBeTruthy();
    });
});
