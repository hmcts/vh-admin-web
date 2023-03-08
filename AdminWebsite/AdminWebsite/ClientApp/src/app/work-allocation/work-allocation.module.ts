import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { EditWorkHoursComponent } from './edit-work-hours/edit-work-hours.component';
import { VhoSearchComponent } from './edit-work-hours/vho-search/vho-search.component';

import { WorkAllocationRoutingModule } from './work-allocation-routing.module';
import { WorkAllocationComponent } from './work-allocation.component';

import { VhoWorkHoursTableComponent } from './edit-work-hours/vho-work-hours-table/vho-work-hours-table.component';
import { VhoWorkHoursNonAvailabilityTableComponent } from './edit-work-hours/vho-work-hours-non-availability-table/vho-work-hours-non-availability-table.component';
import { UploadWorkHoursComponent } from './upload-work-hours/upload-work-hours.component';
import { ManageTeamComponent } from './manage-team/manage-team.component';
import { AllocateHearingsComponent } from './allocate-hearings/allocate-hearings.component';
import { ConfirmDeleteHoursPopupComponent } from './pop-ups/confirm-delete-popup/confirm-delete-popup.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PopupModule } from '../popups/popup.module';
import { JusticeUserFormComponent } from './justice-user-form/justice-user-form.component';
import { ConfirmDeleteJusticeUserPopupComponent } from './pop-ups/confirm-delete-justice-user-popup/confirm-delete-justice-user-popup.component';

@NgModule({
    declarations: [
        WorkAllocationComponent,
        EditWorkHoursComponent,
        VhoSearchComponent,
        VhoWorkHoursTableComponent,
        VhoWorkHoursNonAvailabilityTableComponent,
        UploadWorkHoursComponent,
        ManageTeamComponent,
        AllocateHearingsComponent,
        ConfirmDeleteHoursPopupComponent,
        JusticeUserFormComponent,
        ConfirmDeleteJusticeUserPopupComponent
    ],
    imports: [SharedModule, WorkAllocationRoutingModule, FontAwesomeModule, PopupModule]
})
export class WorkAllocationModule {}
