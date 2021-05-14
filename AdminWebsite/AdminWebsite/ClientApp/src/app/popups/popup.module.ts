import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { CancelPopupComponent } from './cancel-popup/cancel-popup.component';
import { ConfirmationPopupComponent } from './confirmation-popup/confirmation-popup.component';
import { SignOutPopupComponent } from './sign-out-popup/sign-out-popup.component';
import { SaveFailedPopupComponent } from './save-failed-popup/save-failed-popup.component';
import { CancelBookingPopupComponent } from './cancel-booking-popup/cancel-booking-popup.component';
import { WaitPopupComponent } from './wait-popup/wait-popup.component';
import { DiscardConfirmPopupComponent } from './discard-confirm-popup/discard-confirm-popup.component';
import { UpdateUserPopupComponent } from './update-user-popup/update-user-popup.component';
import { ConfirmBookingFailedPopupComponent } from './confirm-booking-failed-popup/confirm-booking-failed-popup.component';
import { RemoveInterpreterPopupComponent } from './remove-interpreter-popup/remove-interpreter-popup.component';
import { CancelBookingFailedPopupComponent } from './cancel-booking-failed-popup/cancel-booking-failed-popup.component';
@NgModule({
    imports: [SharedModule],
    declarations: [
        CancelPopupComponent,
        ConfirmationPopupComponent,
        SignOutPopupComponent,
        SaveFailedPopupComponent,
        ConfirmBookingFailedPopupComponent,
        CancelBookingPopupComponent,
        WaitPopupComponent,
        DiscardConfirmPopupComponent,
        UpdateUserPopupComponent,
        RemoveInterpreterPopupComponent,
        CancelBookingFailedPopupComponent
    ],
    exports: [
        CancelPopupComponent,
        ConfirmationPopupComponent,
        SignOutPopupComponent,
        WaitPopupComponent,
        SaveFailedPopupComponent,
        ConfirmBookingFailedPopupComponent,
        DiscardConfirmPopupComponent,
        CancelBookingPopupComponent,
        UpdateUserPopupComponent,
        RemoveInterpreterPopupComponent,
        CancelBookingFailedPopupComponent
    ]
})
export class PopupModule {}
