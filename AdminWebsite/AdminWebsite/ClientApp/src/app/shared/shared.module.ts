import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
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
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { CaseTypesMenuComponent } from './menus/case-types-menu/case-types-menu.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { JusticeUsersMenuComponent } from './menus/justice-users-menu/justice-users-menu.component';
import { VenuesMenuComponent } from './menus/venues-menu/venues-menu.component';
import { MinutesToHoursPipe } from './pipes/minutes-to-hours.pipe';
import { TooltipDirective } from './directives/tooltip.directive';
import { SelectComponent } from './select';
import { RolesToDisplayPipe } from './pipes/roles-to-display.pipe';
import { SpinnerInterceptor } from './interceptors/spinner.interceptor';
import { TruncatableTextComponent } from './truncatable-text/truncatable-text.component';
import { FeatureFlagDirective } from '../src/app/shared/feature-flag.directive';
import { ScreeningEnabledBageComponent as ScreeningEnabledBadgeComponent } from './screening-enabled-badge/screening-enabled-badge.component';

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
        NgSelectModule,
        FontAwesomeModule
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
        VenuesMenuComponent,
        MinutesToHoursPipe,
        RolesToDisplayPipe,
        TooltipDirective,
        FeatureFlagDirective,
        SelectComponent,
        TruncatableTextComponent,
        ScreeningEnabledBadgeComponent
    ],
    providers: [WindowRef, WindowScrolling, { provide: HTTP_INTERCEPTORS, useClass: SpinnerInterceptor, multi: true }],
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
        VenuesMenuComponent,
        MinutesToHoursPipe,
        TooltipDirective,
        FeatureFlagDirective,
        SelectComponent,
        RolesToDisplayPipe,
        TruncatableTextComponent,
        ScreeningEnabledBadgeComponent
    ]
})
export class SharedModule {
    constructor(library: FaIconLibrary) {
        library.addIcons(faExclamationCircle);
    }
}
