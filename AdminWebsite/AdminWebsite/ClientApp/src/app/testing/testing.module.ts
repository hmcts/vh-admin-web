import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbStubComponent } from './stubs/breadcrumb-stub';
import { CancelPopupStubComponent } from './stubs/cancel-popup-stub';
import { ConfirmationPopupStubComponent } from './stubs/confirmation-popup-stub';
import { DashboardStubComponent } from './stubs/dashboard-stub';
import { FooterStubComponent } from './stubs/footer-stub';
import { HeaderStubComponent } from './stubs/header-stub';
import { PaginationStubComponent } from './stubs/pagination-stub';
import { ParticipantsListStubComponent } from './stubs/participant-list-stub';
import { SearchEmailStubComponent } from './stubs/search-email-stub';
import { SignOutStubComponent } from './stubs/sign-out-stub';
import { SignOutPopupStubComponent } from './stubs/sign-out-popup-stub';
import { RemovePopupStubComponent } from './stubs/remove-popup-stub';
import { BookingEditStubComponent } from './stubs/booking-edit-stub';

@NgModule({
    imports: [CommonModule],
    declarations: [
        BreadcrumbStubComponent,
        CancelPopupStubComponent,
        ConfirmationPopupStubComponent,
        DashboardStubComponent,
        FooterStubComponent,
        HeaderStubComponent,
        PaginationStubComponent,
        ParticipantsListStubComponent,
        SearchEmailStubComponent,
        RemovePopupStubComponent,
        BookingEditStubComponent,
        SearchEmailStubComponent,
        SignOutPopupStubComponent,
        SignOutStubComponent
    ]
})
export class TestingModule {}
