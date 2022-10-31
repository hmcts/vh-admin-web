import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Logger } from 'src/app/services/logger';

import { ConfirmDeleteHoursPopupComponent } from './confirm-delete-popup.component';
import { VhoNonAvailabilityWorkHoursResponse } from '../../services/clients/api-client';

describe('ConfirmDeleteHoursPopupComponent', () => {
    let component: ConfirmDeleteHoursPopupComponent;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['debug']);
    const slotToDelete = new VhoNonAvailabilityWorkHoursResponse();

    beforeEach(() => {
        component = new ConfirmDeleteHoursPopupComponent(loggerSpy);
        spyOn(component.deletionAnswer, 'emit');

        slotToDelete.id = 1;
        slotToDelete.start_time = new Date();
        slotToDelete.end_time = new Date();
        component.slotToDelete = slotToDelete;
    });

    it('should emit true on confirm', () => {
        component.ngOnInit();
        component.confirmDelete();
        expect(component.deletionAnswer.emit).toHaveBeenCalledWith(true);
        expect(component.startDate).toBe(slotToDelete.start_time.toDateString());
        expect(component.endDate).toBe(slotToDelete.end_time.toDateString());
    });

    it('should emit false on cancel', () => {
        component.ngOnInit();
        component.cancelDelete();
        expect(component.deletionAnswer.emit).toHaveBeenCalledWith(false);
    });
});
