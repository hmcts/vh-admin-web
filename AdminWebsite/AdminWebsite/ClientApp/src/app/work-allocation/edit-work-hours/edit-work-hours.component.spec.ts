import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditWorkHoursComponent } from './edit-work-hours.component';
import { VhoSearchResponse } from '../../services/clients/api-client';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('EditWorkHoursComponent', () => {
    let component: EditWorkHoursComponent;
    let fixture: ComponentFixture<EditWorkHoursComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditWorkHoursComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditWorkHoursComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    describe('rendering', () => {
        it('should show vh team leader view', () => {
            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('details')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual(`Edit working hours / non-availability`);
        });
        it('should show vho view', () => {
            component.isVhTeamLeader = false;
            fixture.detectChanges();

            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('details')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual('Edit working hours / non-availability');
        });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('setSearchResult should assign event to results property', () => {
        const parameter = new VhoSearchResponse();
        component.setSearchResult(parameter);
        expect(component).toBeTruthy();
        expect(component.result).toBe(parameter);
    });
});
