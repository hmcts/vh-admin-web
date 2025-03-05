import { Component, EventEmitter, Output } from '@angular/core';
import { BookingPersistService } from '../../../services/bookings-persist.service';
import { FormBuilder } from '@angular/forms';
import { CaseTypeResponse } from '../../../services/clients/api-client';
import { Logger } from '../../../services/logger';
import { MenuBase } from '../menu-base';
import { ReferenceDataService } from 'src/app/services/reference-data.service';

@Component({
    selector: 'app-case-types-menu',
    templateUrl: './case-types-menu.component.html',
    styleUrls: ['./case-types-menu.component.scss'],
    standalone: false
})
export class CaseTypesMenuComponent extends MenuBase {
    loggerPrefix = '[MenuCaseTypes] -';
    formGroupName = 'selectedCaseTypes';
    caseTypes: string[];
    selectedItems: string[];
    formConfiguration: any;

    @Output() selectedEmitter = new EventEmitter<string[]>();

    constructor(
        private readonly bookingPersistService: BookingPersistService,
        private readonly referenceDataService: ReferenceDataService,
        formBuilder: FormBuilder,
        logger: Logger
    ) {
        super(formBuilder, logger);
        this.formConfiguration = {
            selectedCaseTypes: [this.bookingPersistService.selectedCaseTypes || []]
        };
    }

    loadItems(): void {
        const distinct = (value, index, array) => array.indexOf(value) === index;
        this.referenceDataService.getCaseTypes().subscribe({
            next: (data: CaseTypeResponse[]) => {
                this.caseTypes = this.items = [
                    ...Array.from(
                        data
                            .map(item => item.name)
                            .filter(distinct)
                            .sort((a, b) => a.localeCompare(b))
                    )
                ];
                this.logger.debug(`${this.loggerPrefix} Updating list of case-types.`, { caseTypes: data.length });
            },
            error: error => this.handleListError(error, 'Services')
        });
    }
}
