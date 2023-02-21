import { Component, EventEmitter, Output } from '@angular/core';
import { BookingPersistService } from '../../../services/bookings-persist.service';
import { FormBuilder } from '@angular/forms';
import { HearingTypeResponse } from '../../../services/clients/api-client';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { Logger } from '../../../services/logger';
import { MenuBase } from '../menu-base';

@Component({
    selector: 'app-case-types-menu',
    templateUrl: './case-types-menu.component.html',
    styleUrls: ['./case-types-menu.component.scss']
})
export class CaseTypesMenuComponent extends MenuBase {
    loggerPrefix = '[MenuCaseTypes] -';
    formGroupName = 'selectedCaseTypes';
    caseTypes: string[];
    selectedItems: string[];
    formConfiguration = {
        selectedCaseTypes: [this.bookingPersistService.selectedCaseTypes || []]
    };

    @Output() selectedEmitter = new EventEmitter<string[]>();

    constructor(
        private bookingPersistService: BookingPersistService,
        private videoHearingService: VideoHearingsService,
        formBuilder: FormBuilder,
        logger: Logger
    ) {
        super(formBuilder, logger);
    }

    loadItems(): void {
        const distinct = (value, index, array) => array.indexOf(value) === index;
        this.videoHearingService.getHearingTypes().subscribe(
            (data: HearingTypeResponse[]) => {
                this.caseTypes = this.items = [
                    ...Array.from(
                        data
                            .map(item => item.group)
                            .filter(distinct)
                            .sort()
                    )
                ];
                this.logger.debug(`${this.loggerPrefix} Updating list of case-types.`, { caseTypes: data.length });
            },
            error => this.handleListError(error, 'case types')
        );
    }
}
