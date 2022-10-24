import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { VhoWorkHoursResponse } from 'src/app/services/clients/api-client';

import { VhoWorkHoursTableComponent } from './vho-work-hours-table.component';

describe('VhoWorkHoursTableComponent', () => {
    let component: VhoWorkHoursTableComponent;
    let fixture: ComponentFixture<VhoWorkHoursTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VhoWorkHoursTableComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VhoWorkHoursTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('UI tests', () => {
        it('should show work hours table when work hours not empty', () => {
            component.workHours = [
                new VhoWorkHoursResponse()
            ];
            fixture.detectChanges();
            
            const workHoursTable = fixture.debugElement
                .query(By.css('#individual-work-hours-table')).nativeElement;

            expect(workHoursTable).toBeTruthy();
        });

        it('should not show work hours table when work hours are empty', () => {
            component.workHours = [];
            fixture.detectChanges();
            
            const workHoursTable = fixture.debugElement
                .query(By.css('#individual-work-hours-table'));

            expect(workHoursTable).toBeNull();
        });

        it('should switch to edit mode when edit button is clicked', () => {
            component.isEditing = false;
            const spy = spyOn(component, 'switchToEditMode');
            const editButton = fixture.debugElement
                .query(By.css('#edit-individual-work-hours-button')).nativeElement;

            editButton.click();
            fixture.detectChanges();

            expect(spy).toBeTruthy();
        });

        it('should save when save button is clicked', () => {
            component.isEditing = true;
            fixture.detectChanges();
            const spy = spyOn(component, 'saveWorkingHours');
            const saveButton = fixture.debugElement
                .query(By.css('#save-individual-work-hours-button')).nativeElement;

            saveButton.click();

            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should cancel editing mode when cancel button is clicked', () => {
            component.isEditing = true;
            fixture.detectChanges();
            const spy = spyOn(component, 'cancelEditingWorkingHours');
            const cancelButton = fixture.debugElement
                .query(By.css('#cancel-editing-individual-work-hours-button')).nativeElement;

            cancelButton.click();

            expect(spy).toHaveBeenCalledTimes(1);
        });
      });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('cancelEditingWorkingHours', () => {
        it('should set edit mode to false', () => {
            component.isEditing = true;

            component.cancelEditingWorkingHours();
          
            expect(component.isEditing).toBeFalsy();
        });

        it('should set work hours back to original values', () => {
            const originalMondayWorkHours = new VhoWorkHoursResponse();
            originalMondayWorkHours.day_of_week_id = 1;
            originalMondayWorkHours.end_time = '17:00';
            originalMondayWorkHours.start_time = '09:00';

            const editedMondayWorkHours = new VhoWorkHoursResponse();
            originalMondayWorkHours.day_of_week_id = 1;
            originalMondayWorkHours.end_time = '17:00';
            originalMondayWorkHours.start_time = '09:00';

            component.originalWorkHours = [
                originalMondayWorkHours
            ];

            component.workHours = [
                editedMondayWorkHours
            ]
            
            component.switchToEditMode();

            expect(JSON.stringify(component.originalWorkHours)).
                toEqual(JSON.stringify(component.workHours));
        });
    });

    fdescribe('saveWorkingHours', () => {
        it('should add end time before start time error', () => {
            const workHours = [
                new VhoWorkHoursResponse({
                    day_of_week_id: 1,
                    end_time: '09:00',
                    start_time: '12:00',
                })
            ] as VhoWorkHoursResponse[];

            component.workHours = workHours;

            component.saveWorkingHours();

            expect(component.workHoursEndTimeBeforeStartTimeErrors.length).toBe(1);
            expect(component.workHoursEndTimeBeforeStartTimeErrors[0]).toBe(0);
        });

        it('should not emit event if errors exist', () => {
            const workHours = [
                new VhoWorkHoursResponse({
                    day_of_week_id: 1,
                    end_time: '09:00',
                    start_time: '12:00',
                })
            ] as VhoWorkHoursResponse[];

            component.workHours = workHours;

            spyOn(component.saveWorkHours, 'emit');
            component.saveWorkingHours();

            expect(component.saveWorkHours.emit).not.toHaveBeenCalledTimes(1);
        });

        it('should emit event if no errors exist', () => {
            const workHours = [
                new VhoWorkHoursResponse({
                    day_of_week_id: 1,
                    end_time: '12:00',
                    start_time: '09:00',
                })
            ] as VhoWorkHoursResponse[];

            component.workHours = workHours;

            spyOn(component.saveWorkHours, 'emit');
            component.saveWorkingHours();

            expect(component.saveWorkHours.emit).toHaveBeenCalledTimes(1);
            expect(component.saveWorkHours.emit)
                .toHaveBeenCalledWith(component.workHours);
        });
    });

    describe('switchToEditMode', () => {
        it('should set component to editing when work hours are not empty', () => {
            component.isEditing = false;
            component.workHours = [
                new VhoWorkHoursResponse()
            ];
            
            component.switchToEditMode();

            expect(component.isEditing).toBeTruthy();
        });

        it('should not set component to editing when work hours is empty', () => {
            component.isEditing = false;
            component.workHours = [];
            
            component.switchToEditMode();

            expect(component.isEditing).toBeFalsy();
        });

        it('should make a copy of original work hours', () => {
            const mondayWorkHours = new VhoWorkHoursResponse();
            mondayWorkHours.day_of_week_id = 1;
            mondayWorkHours.end_time = '17:00';
            mondayWorkHours.start_time = '09:00';

            component.workHours = [
                mondayWorkHours
            ];
            
            component.switchToEditMode();

            expect(JSON.stringify(component.originalWorkHours)).
                toEqual(JSON.stringify(component.workHours));
        });
    });
});
