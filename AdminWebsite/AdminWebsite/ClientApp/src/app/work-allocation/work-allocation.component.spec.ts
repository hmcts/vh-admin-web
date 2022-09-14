import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { UserIdentityService } from '../services/user-identity.service';

import { WorkAllocationComponent } from './work-allocation.component';

describe('WorkAllocationComponent', () => {
    let component: WorkAllocationComponent;
    let fixture: ComponentFixture<WorkAllocationComponent>;

    let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;
    userIdentityServiceSpy = jasmine.createSpyObj('UserIdentityService', ['getUserInformation']);
    userIdentityServiceSpy.getUserInformation.and.returnValue(
        of({
            is_vh_team_leader: true
        })
    );

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WorkAllocationComponent],
            providers: [{ provide: UserIdentityService, useValue: userIdentityServiceSpy }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkAllocationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('rendering', () => {
        it('should show vh team leader view', () => {
            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('div')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual(`Upload working hours / non-availability
Edit working hours / non-availability
Manage team
Allocate hearings`);
        });

        it('should show vho view', () => {
            component.isVhTeamLeader = false;
            fixture.detectChanges();

            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('div')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual('Edit working hours / non-availability');
        });
    });

    it('should retrieve vh team leader status', () => {
        expect(component.isVhTeamLeader).toBeTruthy();
    });
});
