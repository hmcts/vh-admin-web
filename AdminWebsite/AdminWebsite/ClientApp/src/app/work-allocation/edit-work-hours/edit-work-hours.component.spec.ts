import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWorkHoursComponent } from './edit-work-hours.component';
import { VhoSearchResponse } from '../../services/clients/api-client';

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
