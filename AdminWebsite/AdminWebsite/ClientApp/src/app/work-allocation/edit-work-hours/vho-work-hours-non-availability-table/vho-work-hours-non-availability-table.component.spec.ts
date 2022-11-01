import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { VhoWorkHoursNonAvailabilityTableComponent } from './vho-work-hours-non-availability-table.component';
import { BHClient, VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { Logger } from '../../../services/logger';
import { ConfirmDeleteHoursPopupComponent } from '../../../popups/confirm-delete-popup/confirm-delete-popup.component';
import { HttpTestingController } from '@angular/common/http/testing';
import { Observable, of, throwError } from 'rxjs';

describe('VhoNonAvailabilityWorkHoursTableComponent', () => {
    let component: VhoWorkHoursNonAvailabilityTableComponent;
    let fixture: ComponentFixture<VhoWorkHoursNonAvailabilityTableComponent>;
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(async () => {
        bHClientSpy = jasmine.createSpyObj('BHClient', ['deleteNonAvailabilityWorkHours']);
        //bHClientSpy.deleteNonAvailabilityWorkHours = new Observable()
        bHClientSpy.deleteNonAvailabilityWorkHours.and.returnValue(of({value: 0}));
        loggerSpy = jasmine.createSpyObj('Logger', ['info', 'error']);
        await TestBed.configureTestingModule({
            providers: [
                {provide: Logger, useValue: loggerSpy},
                {provide: BHClient, useValue: bHClientSpy}
            ],
            declarations: [VhoWorkHoursNonAvailabilityTableComponent, ConfirmDeleteHoursPopupComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VhoWorkHoursNonAvailabilityTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('check results input parameter sets the value', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            end_time: new Date(),
            start_time: new Date()
        });
        component.result = [slot];
        fixture.detectChanges();
        expect(component.nonWorkHours).toEqual([slot]);
    });

    it('check the slot is not removed if confirmation is popup is false', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            end_time: new Date(),
            start_time: new Date()
        });
        component.result = [slot];
        component.delete(slot);
        component.onDeletionAnswer(false);
        fixture.detectChanges();
        expect(component.nonWorkHours).toEqual([slot]);
        expect(bHClientSpy.deleteNonAvailabilityWorkHours).toHaveBeenCalledTimes(0);
        expect(component.displayConfirmPopup).toBeFalsy();
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

    it('check remove slot from result when confirm deletion', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            end_time: new Date(),
            start_time: new Date()
        });
        component.result = [slot];
        component.delete(slot);
        component.onDeletionAnswer(true);
        fixture.detectChanges();

        expect(component.nonWorkHours.length).toEqual(0);
        expect(component.displayConfirmPopup).toBeFalsy();
    });

    it('check slot not removed from result when confirm deletion but error in api', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            end_time: new Date(),
            start_time: new Date()
        });
        bHClientSpy.deleteNonAvailabilityWorkHours.and.returnValue(throwError({ status: 500 }));
        component.result = [slot];
        component.delete(slot);
        component.onDeletionAnswer(true);
        fixture.detectChanges();
        expect(component.nonWorkHours.length).toEqual(1);
        expect(component.displayConfirmPopup).toBeFalsy();
        expect(loggerSpy.error).toHaveBeenCalledTimes(1);
    });
})
