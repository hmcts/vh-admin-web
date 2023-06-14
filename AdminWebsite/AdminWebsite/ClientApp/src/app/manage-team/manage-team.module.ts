import { NgModule } from '@angular/core';

import { ManageTeamRoutingModule } from './manage-team-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ManageTeamComponent } from './manage-team/manage-team.component';
import { JusticeUserFormComponent } from './justice-user-form/justice-user-form.component';
import { ConfirmDeleteHoursPopupComponent } from './pop-ups/confirm-delete-popup/confirm-delete-popup.component';
import { ConfirmDeleteJusticeUserPopupComponent } from './pop-ups/confirm-delete-justice-user-popup/confirm-delete-justice-user-popup.component';
import { ConfirmRestoreJusticeUserPopupComponent } from './pop-ups/confirm-restore-justice-user-popup/confirm-restore-justice-user-popup.component';

@NgModule({
    declarations: [
        ManageTeamComponent,
        JusticeUserFormComponent,
        ConfirmDeleteHoursPopupComponent,
        ConfirmDeleteJusticeUserPopupComponent,
        ConfirmRestoreJusticeUserPopupComponent
    ],
    imports: [SharedModule, FontAwesomeModule, ManageTeamRoutingModule],
    exports: [ManageTeamComponent]
})
export class ManageTeamModule {}
