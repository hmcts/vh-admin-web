import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkAllocationComponent } from './work-allocation.component';

const routes: Routes = [{ path: '', component: WorkAllocationComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WorkAllocationRoutingModule {}
