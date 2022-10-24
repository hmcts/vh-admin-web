import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VhoWorkHoursTableComponent } from './vho-work-hours-table.component';
import { VhoWorkHoursResponse } from '../../../services/clients/api-client';

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
        component = fixture.debugElement.children[0].componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('check input set has value', () => {
        component.result = [new VhoWorkHoursResponse()];
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.workHours).toEqual([new VhoWorkHoursResponse()]);
    });
    it('check input set is null', () => {
        component.result = null;
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.workHours).toBeNull();
    });
});
