import { Directive, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { BookingService } from '../../services/booking.service';
import { VideoHearingsService } from '../../services/video-hearings.service';

@Directive()
export abstract class BookingBaseComponentDirective implements OnInit {
    protected readonly loggerPrefix: string = '[Booking] -';
    protected readonly componentName: string;

    buttonAction: string;
    editMode = false;
    form: FormGroup;

    protected constructor(
        protected bookingService: BookingService,
        protected router: Router,
        protected videoHearingService: VideoHearingsService,
        protected logger: Logger
    ) {
        const componentName = this.constructor.name;
        const index = componentName.indexOf('Component');
        this.componentName = componentName.substring(0, index);
        this.loggerPrefix = `${this.loggerPrefix} [${componentName}] -`;
    }

    ngOnInit() {
        this.editMode = this.bookingService.isEditMode();
        this.logger.debug(`${this.loggerPrefix} On step ${this.componentName}`, { step: this.componentName, editMode: this.editMode });
        this.buttonAction = this.editMode ? 'Save' : 'Next';

        this.form.valueChanges.subscribe(() => {
            this.videoHearingService.setBookingHasChanged(this.form.dirty);
        });
    }

    navigateToSummary() {
        this.logger.debug(`${this.loggerPrefix} Navigating to hearing summary page`, {
            step: this.componentName
        });
        this.resetEditMode();
        this.router.navigate([PageUrls.Summary]);
    }

    resetEditMode() {
        this.bookingService.resetEditMode();
        this.editMode = false;
        this.logger.debug(`${this.loggerPrefix} Resetting edit mode to false`, {
            step: this.componentName
        });
    }
}
