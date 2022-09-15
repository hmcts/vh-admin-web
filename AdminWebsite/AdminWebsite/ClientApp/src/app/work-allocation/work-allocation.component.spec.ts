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

        it('should show working hours file upload max size error', () => {
            component.isWorkingHoursFileUploadError = true;
            component.workingHoursFileUploadError = 'error message';
            fixture.detectChanges();

            const error = fixture.debugElement.query(By.css('#working-hours-file-upload-error'))
                .nativeElement.innerText;
            expect(error).toContain('Error: error message');
        });
    });

    it('should retrieve vh team leader status', () => {
        expect(component.isVhTeamLeader).toBeTruthy();
    });

    describe('handleFileInput', () => {
        it('should reset working hour file upload errors', () => {
            component.isWorkingHoursFileUploadError = true;
            component.workingHoursFileUploadError = 'error message';
            
            const file = new File([""], "filename", { type: 'text/html' });

            component.handleFileInput(file);

            expect(component.isWorkingHoursFileUploadError).toBe(false);
            expect(component.workingHoursFileUploadError).toBe('');
        });
        
        it('should set errors when maximum file size is exceeded', () => {
            const file = new File([""], "filename", { type: 'text/html' });
            Object.defineProperty(file, 'size', { value: 2000001 });

            component.handleFileInput(file);

            expect(component.isWorkingHoursFileUploadError).toBe(true);
            expect(component.workingHoursFileUploadError).toBe('File cannot be larger than 200kb');
        });
      });
});
