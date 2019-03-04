import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ContactUsComponent } from './contact-us/contact-us.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { PaginationComponent } from './pagination/pagination.component';
import { SharedRoutingModule } from './shared-routing.module';
import { ScrollableDirective } from './directives/scroll.directive';
import { SignOutComponent } from './sign-out/sign-out.component';
import { BookingEditComponent } from './booking-edit/booking-edit.component';

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
    SignOutComponent,
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
    SignOutComponent,
  ]
})
export class SharedModule { }
