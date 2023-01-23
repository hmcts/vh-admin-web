import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { CaseTypesMenuComponent } from './menus/case-types-menu/case-types-menu.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { JusticeUsersMenuComponent } from './menus/justice-users-menu/justice-users-menu.component';
import { VenuesMenuComponent } from './menus/venues-menu/venues-menu.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule.withConfig({
            callSetDisabledState: 'whenDisabledForLegacyCode'
        }),
        HttpClientModule,
        SharedRoutingModule,
        ClipboardModule,
        NgSelectModule
    ],
    declarations: [
        HeaderComponent,
        FooterComponent,
        PaginationComponent,
        ScrollTriggerDirective,
        BookingEditComponent,
        LongDatetimePipe,
        CaseTypesMenuComponent,
        JusticeUsersMenuComponent,
        VenuesMenuComponent
    ],
    providers: [WindowRef, WindowScrolling],
    exports: [
        HeaderComponent,
        FooterComponent,
        PaginationComponent,
        BookingEditComponent,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        ScrollTriggerDirective,
        LongDatetimePipe,
        CaseTypesMenuComponent,
        JusticeUsersMenuComponent,
        VenuesMenuComponent
    ]
})
export class SharedModule {
    constructor(library: FaIconLibrary) {
        library.addIcons(faExclamationCircle);
    }
}
