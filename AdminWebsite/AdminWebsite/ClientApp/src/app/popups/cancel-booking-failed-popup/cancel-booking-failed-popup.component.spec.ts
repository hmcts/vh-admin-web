import { EventEmitter } from '@angular/core';
import { CancelBookingFailedPopupComponent } from './cancel-booking-failed-popup.component';

describe('CancelBookingFailedPopupComponent', () => {
    const component = new CancelBookingFailedPopupComponent();

    it('should sent event to close the popup', () => {
        component.popupClose = new EventEmitter<boolean>();
        spyOn(component.popupClose, 'emit');

        component.close();

        expect(component.popupClose.emit).toHaveBeenCalled();
    });
});
