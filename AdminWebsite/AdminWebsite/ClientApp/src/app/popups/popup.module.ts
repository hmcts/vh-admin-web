import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { CancelPopupComponent } from './cancel-popup/cancel-popup.component';
import { ConfirmationPopupComponent } from './confirmation-popup/confirmation-popup.component';
import { SignOutPopupComponent } from './sign-out-popup/sign-out-popup.component';
import { SaveFailedPopupComponent } from './save-failed-popup/save-failed-popup.component';
import { WaitPopupComponent } from './wait-popup/wait-popup.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    CancelPopupComponent,
    ConfirmationPopupComponent,
    SignOutPopupComponent,
    SaveFailedPopupComponent,
    WaitPopupComponent,
  ],
  exports: [
    CancelPopupComponent,
    ConfirmationPopupComponent,
    SignOutPopupComponent,
    WaitPopupComponent,
  ]
})
export class PopupModule { }
