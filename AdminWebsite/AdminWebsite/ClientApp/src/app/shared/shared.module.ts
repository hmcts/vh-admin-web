import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ContactUsComponent } from './contact-us/contact-us.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { PaginationComponent } from './pagination/pagination.component';
import { SharedRoutingModule } from './shared-routing.module';
import { ScrollTriggerDirective } from './directives/scroll-trigger.directive';
import { BookingEditComponent } from './booking-edit/booking-edit.component';
import { WindowRef } from './window-ref';
import { LongDatetimePipe } from './directives/date-time.pipe';
import { WindowScrolling } from './window-scrolling';
import { ClipboardModule } from 'ngx-clipboard';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@NgModule({
    imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule, SharedRoutingModule, ClipboardModule],
    declarations: [
        HeaderComponent,
        FooterComponent,
        ContactUsComponent,
        PaginationComponent,
        ScrollTriggerDirective,
        BookingEditComponent,
        LongDatetimePipe
    ],
    providers: [WindowRef, WindowScrolling],
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
        ScrollTriggerDirective,
        LongDatetimePipe
    ]
})
export class SharedModule {}
