import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { BookingsListRoutingModule } from './bookings-list-routing.module';

@NgModule({
  imports: [
    SharedModule,
    BookingsListRoutingModule,
  ],
  declarations: [
    BookingsListComponent,
  ],
  exports: [
    BookingsListComponent
  ]
})
export class BookingsListModule { }
