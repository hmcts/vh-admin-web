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
    styleUrls: ['./venues-menu.component.scss']
})
export class VenuesMenuComponent extends MenuBase {
    loggerPrefix = '[MenuVenues] -';
    formGroupName = 'selectedVenueIds';
    venues: HearingVenueResponse[];
    selectedItems: [];
    formConfiguration = {
        selectedVenueIds: [this.bookingPersistService.selectedVenueIds || []]
    };

    @Output() selectedEmitter = new EventEmitter<number[]>();

    constructor(
        private bookingPersistService: BookingPersistService,
        private refDataService: ReferenceDataService,
        formBuilder: FormBuilder,
        logger: Logger
    ) {
        super(formBuilder, logger);
    }

    loadItems(): void {
        this.refDataService.getCourts().subscribe(
            (data: HearingVenueResponse[]) => {
                this.venues = data;
                this.logger.debug(`${this.loggerPrefix} Updating list of venues.`, { venues: data.length });
            },
            error => this.handleListError(error, 'venues')
        );
    }
}
