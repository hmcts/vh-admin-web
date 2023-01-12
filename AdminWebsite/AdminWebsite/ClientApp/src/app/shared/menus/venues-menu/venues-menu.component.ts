import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MenuBase } from '../menu-base';
import { HearingVenueResponse, JusticeUserResponse } from '../../../services/clients/api-client';
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
    persistentItems = this.bookingPersistService.selectedVenueIds;
    formConfiguration = {
        selectedVenueIds: [this.bookingPersistService.selectedVenueIds || []],
    };

    @Output() selectedEmitter = new EventEmitter<number[]>();
    @Input() clearEmitter = new EventEmitter();



    constructor(
        private bookingPersistService: BookingPersistService,
        private refDataService: ReferenceDataService,
        formBuilder: FormBuilder,
        logger: Logger
    ) { super(formBuilder, logger)}

    loadItems(): void {
        const self = this;
        this.refDataService.getCourts().subscribe(
            (data: HearingVenueResponse[]) => {
                this.venues = data;
                this.logger.debug(`${this.loggerPrefix} Updating list of venues.`, { venues: data.length });
            },
            error => self.handleListError(error, 'venues')
        );
    }

}
