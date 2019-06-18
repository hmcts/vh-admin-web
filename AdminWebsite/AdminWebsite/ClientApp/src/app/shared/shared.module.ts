import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ContactUsComponent } from './contact-us/contact-us.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { PaginationComponent } from './pagination/pagination.component';
import { SharedRoutingModule } from './shared-routing.module';
import { ScrollableDirective } from './directives/scrollable.directive';
import { BookingEditComponent } from './booking-edit/booking-edit.component';
import { WindowRef } from './window-ref';
import { LongDatetimePipe } from './directives/date-time.pipe';
import { BH_API_BASE_URL } from '../services/clients/api-client';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    SharedRoutingModule
  ],
  declarations: [
    HeaderComponent,
    FooterComponent,
    ContactUsComponent,
    PaginationComponent,
    ScrollableDirective,
    BookingEditComponent,
    LongDatetimePipe
  ],
  providers: [
    WindowRef,
    { provide: BH_API_BASE_URL, useFactory: () => '.' },
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    ContactUsComponent,
    PaginationComponent,
    BookingEditComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ScrollableDirective,
    LongDatetimePipe
  ]
})
export class SharedModule { }
