import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

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
        it('should set to edit mode when edit button is clicked', () => {
            component.isEditing = false;
            const editButton = fixture.debugElement
                .query(By.css('#edit-individual-work-hours-button')).nativeElement;

            editButton.click();
            fixture.detectChanges();

            expect(component.isEditing).toBeTruthy();
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
      });
});
