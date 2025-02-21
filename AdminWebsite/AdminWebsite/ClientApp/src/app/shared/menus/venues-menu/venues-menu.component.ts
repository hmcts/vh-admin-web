import { Component, EventEmitter, Output } from '@angular/core';
import { MenuBase } from '../menu-base';
import { HearingVenueResponse } from '../../../services/clients/api-client';
import { BookingPersistService } from '../../../services/bookings-persist.service';
import { FormBuilder } from '@angular/forms';
import { Logger } from '../../../services/logger';
import { ReferenceDataService } from '../../../services/reference-data.service';

@Component({
    selector: 'app-venues-menu',
    templateUrl: './venues-menu.component.html',
    styleUrls: ['./venues-menu.component.scss'],
    standalone: false
})
export class VenuesMenuComponent extends MenuBase {
    loggerPrefix = '[MenuVenues] -';
    formGroupName = 'selectedVenueIds';
    venues: HearingVenueResponse[];
    selectedItems: [];
    formConfiguration: any;

    @Output() selectedEmitter = new EventEmitter<number[]>();

    constructor(
        private readonly bookingPersistService: BookingPersistService,
        private readonly refDataService: ReferenceDataService,
        formBuilder: FormBuilder,
        logger: Logger
    ) {
        super(formBuilder, logger);
        this.formConfiguration = {
            selectedVenueIds: [this.bookingPersistService.selectedVenueIds || []]
        };
    }

    loadItems(): void {
        this.refDataService.getCourts().subscribe({
            next: (data: HearingVenueResponse[]) => {
                this.venues = this.items = [...data];
                this.logger.debug(`${this.loggerPrefix} Updating list of venues.`, { venues: data.length });
            },
            error: error => this.handleListError(error, 'venues')
        });
    }
}
