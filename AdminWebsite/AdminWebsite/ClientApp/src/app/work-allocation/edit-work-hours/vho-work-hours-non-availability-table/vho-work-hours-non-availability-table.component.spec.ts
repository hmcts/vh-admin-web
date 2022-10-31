import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VhoWorkHoursNonAvailabilityTableComponent } from './vho-work-hours-non-availability-table.component';
import { VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { EditVhoNonAvailabilityWorkHoursModel } from '../edit-non-work-hours-model';
import { Subject } from 'rxjs';

describe('VhoNonAvailabilityWorkHoursTableComponent', () => {
    let component: VhoWorkHoursNonAvailabilityTableComponent;
    let fixture: ComponentFixture<VhoWorkHoursNonAvailabilityTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VhoWorkHoursNonAvailabilityTableComponent],
            providers: [DatePipe]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VhoWorkHoursNonAvailabilityTableComponent);
        component = fixture.componentInstance;
        component.saveNonWorkHoursCompleted$ = new Subject<void>();
        fixture.detectChanges();
    });

    it('check results input parameter sets the value', () => {
        component.result = [
            new VhoNonAvailabilityWorkHoursResponse({
                id: 1,
                start_time: new Date(2022, 0, 1, 8, 0, 0),
                end_time: new Date(2022, 0, 2, 10, 0, 0)
            })
        ];
        fixture.detectChanges();
        const model: EditVhoNonAvailabilityWorkHoursModel = {
            id: 1,
            start_date: '2022-01-01',
            start_time: '08:00:00',
            end_date: '2022-01-02',
            end_time: '10:00:00'
        };
        expect(component.nonWorkHours).toEqual([model]);
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
