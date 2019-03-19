import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { CancelPopupComponent } from './cancel-popup/cancel-popup.component';
import { ConfirmationPopupComponent } from './confirmation-popup/confirmation-popup.component';
import { SignOutPopupComponent } from './sign-out-popup/sign-out-popup.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    CancelPopupComponent,
    ConfirmationPopupComponent,
    SignOutPopupComponent,
  ],
  exports: [
    CancelPopupComponent,
    ConfirmationPopupComponent,
    SignOutPopupComponent
  ]
})
export class PopupModule { }
