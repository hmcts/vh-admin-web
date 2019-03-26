import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { CancelPopupComponent } from './cancel-popup/cancel-popup.component';
import { ConfirmationPopupComponent } from './confirmation-popup/confirmation-popup.component';
import { SignOutPopupComponent } from './sign-out-popup/sign-out-popup.component';
import { CancelBookingPopupComponent } from './cancel-booking-popup/cancel-booking-popup.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    CancelPopupComponent,
    ConfirmationPopupComponent,
    SignOutPopupComponent,
    CancelBookingPopupComponent,
  ],
  exports: [
    CancelPopupComponent,
    ConfirmationPopupComponent,
    SignOutPopupComponent
  ]
})
export class PopupModule { }
