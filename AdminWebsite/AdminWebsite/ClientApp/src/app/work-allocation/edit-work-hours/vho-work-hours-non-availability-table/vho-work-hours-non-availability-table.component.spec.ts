import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VhoWorkHoursNonAvailabilityTableComponent } from './vho-work-hours-non-availability-table.component';
import { VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';

describe('VhoNonAvailabilityWorkHoursTableComponent', () => {
    let component: VhoWorkHoursNonAvailabilityTableComponent;
    let fixture: ComponentFixture<VhoWorkHoursNonAvailabilityTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VhoWorkHoursNonAvailabilityTableComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VhoWorkHoursNonAvailabilityTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('check results input parameter sets the value', () => {
        component.result = [new VhoNonAvailabilityWorkHoursResponse()];
        fixture.detectChanges();
        expect(component.nonWorkHours).toEqual([new VhoNonAvailabilityWorkHoursResponse()]);
    });

    it('check results input parameter sets to null', () => {
        component.result = null;
        fixture.detectChanges();
        expect(component.nonWorkHours).toBeNull();
    });

    it('check results input parameter, when wrong type sets to null', () => {
        component.result = [new VhoWorkHoursResponse()];
        fixture.detectChanges();
        expect(component.nonWorkHours).toBeNull();
    });
});
