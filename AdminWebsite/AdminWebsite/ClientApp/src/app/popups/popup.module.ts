import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { CancelPopupComponent } from './cancel-popup/cancel-popup.component';
import { ConfirmationPopupComponent } from './confirmation-popup/confirmation-popup.component';
import { RemovePopupComponent } from './remove-popup/remove-popup.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    CancelPopupComponent,
    ConfirmationPopupComponent,
    RemovePopupComponent,
  ],
  exports: [
    CancelPopupComponent,
    ConfirmationPopupComponent,
    RemovePopupComponent,
  ]
})
export class PopupModule { }
