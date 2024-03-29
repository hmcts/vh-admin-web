import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { AuthGuard } from '../security/guards/auth.guard';
import { AdminGuard } from '../security/guards/admin.guard';

export const routes: Routes = [
    { path: 'bookings-list', component: BookingsListComponent, canActivate: [AuthGuard, AdminGuard] },
    {
        path: 'booking-details',
        component: BookingDetailsComponent,
        canActivate: [AuthGuard, AdminGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BookingsListRoutingModule {}
