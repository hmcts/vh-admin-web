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
            const editButton = fixture.debugElement.query(By.css('#edit-work-hours-button')).nativeElement;
            editButton.click();

            fixture.detectChanges();

            expect(component.isEditing).toBeTruthy();
        });
      });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
