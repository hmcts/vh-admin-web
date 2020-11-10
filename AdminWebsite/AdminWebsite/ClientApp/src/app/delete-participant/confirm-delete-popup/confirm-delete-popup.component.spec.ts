import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Logger } from 'src/app/services/logger';

import { ConfirmDeletePopupComponent } from './confirm-delete-popup.component';

describe('ConfirmDeletePopupComponent', () => {
    let component: ConfirmDeletePopupComponent;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['debug']);

    beforeEach(() => {
        component = new ConfirmDeletePopupComponent(loggerSpy);
        spyOn(component.deletionAnswer, 'emit');
    });

    it('should emit true on confirm', () => {
        component.confirmDelete();
        expect(component.deletionAnswer.emit).toHaveBeenCalledWith(true);
    });

    it('should emit false on cancel', () => {
        component.cancelDelete();
        expect(component.deletionAnswer.emit).toHaveBeenCalledWith(false);
    });
});
