import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { EditWorkHoursComponent } from './edit-work-hours/edit-work-hours.component';
import { VhoSearchComponent } from './edit-work-hours/vho-search/vho-search.component';

import { WorkAllocationRoutingModule } from './work-allocation-routing.module';
import { WorkAllocationComponent } from './work-allocation.component';

import { VhoWorkHoursTableComponent } from './edit-work-hours/vho-work-hours-table/vho-work-hours-table.component';
import { VhoWorkHoursNonAvailabilityTableComponent } from './edit-work-hours/vho-work-hours-non-availability-table/vho-work-hours-non-availability-table.component';
import { UploadWorkHoursComponent } from './upload-work-hours/upload-work-hours.component';
import { AllocateHearingsComponent } from './allocate-hearings/allocate-hearings.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PopupModule } from '../popups/popup.module';
import { ManageTeamModule } from '../manage-team/manage-team.module';

@NgModule({
    declarations: [
        WorkAllocationComponent,
        EditWorkHoursComponent,
        VhoSearchComponent,
        VhoWorkHoursTableComponent,
        VhoWorkHoursNonAvailabilityTableComponent,
        UploadWorkHoursComponent,
        AllocateHearingsComponent
    ],
    imports: [SharedModule, WorkAllocationRoutingModule, ManageTeamModule, FontAwesomeModule, PopupModule]
})
export class WorkAllocationModule {}
