import { Logger } from 'src/app/services/logger';
import { ConfirmDeleteHoursPopupComponent } from './confirm-delete-popup.component';
import { EditVhoNonAvailabilityWorkHoursModel } from '../../work-allocation/edit-work-hours/edit-non-work-hours-model';
import { CombineDateAndTime } from '../../common/formatters/combine-date-and-time';

describe('ConfirmDeleteHoursPopupComponent', () => {
    let component: ConfirmDeleteHoursPopupComponent;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['debug']);
    const slotToDelete = new EditVhoNonAvailabilityWorkHoursModel();

    beforeEach(() => {
        component = new ConfirmDeleteHoursPopupComponent(loggerSpy);
        spyOn(component.deletionAnswer, 'emit');

        slotToDelete.id = 1;

        slotToDelete.start_time = new Date().toTimeString();
        slotToDelete.end_time = new Date().toTimeString();
        slotToDelete.start_date = new Date().toDateString();
        slotToDelete.end_date = new Date().toDateString();
        component.slotToDelete = slotToDelete;
    });

    it('should emit true on confirm', () => {
        component.ngOnInit();
        component.confirmDelete();
        expect(component.deletionAnswer.emit).toHaveBeenCalledWith(true);
        expect(component.startDate).toBe(CombineDateAndTime(slotToDelete.start_date, slotToDelete.start_time).toDateString());
        expect(component.endDate).toBe(CombineDateAndTime(slotToDelete.end_date, slotToDelete.end_time).toDateString());
    });

    it('should emit false on cancel', () => {
        component.ngOnInit();
        component.cancelDelete();
        expect(component.deletionAnswer.emit).toHaveBeenCalledWith(false);
    });
});
