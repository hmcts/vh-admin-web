import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManageReferenceDataComponent } from './manage-reference-data/manage-reference-data.component';

const routes: Routes = [{ path: '', component: ManageReferenceDataComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ReferenceDataRoutingModule {}
