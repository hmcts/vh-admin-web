import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BookingPersistService } from '../../../../services/bookings-persist.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HearingTypeResponse } from '../../../../services/clients/api-client';
import { VideoHearingsService } from '../../../../services/video-hearings.service';
import { Logger } from '../../../../services/logger';

@Component({
  selector: 'app-case-types-menu',
  templateUrl: './case-types-menu.component.html',
  styleUrls: ['./case-types-menu.component.scss']
})
export class CaseTypesMenuComponent implements OnInit {
    private readonly loggerPrefix = '[MenuCaseTypes] -';
    caseTypes: string[];
    error = false;
    selectedCaseTypes: string[];
    caseTypesFormGroup: FormGroup;

    @Output() selectedCaseTypesEmitter = new EventEmitter<string[]>();
    @Input() clearSelection = new EventEmitter();

  constructor(
      private bookingPersistService: BookingPersistService,
      private formBuilder: FormBuilder,
      private videoHearingService: VideoHearingsService,
      private logger: Logger
  ) {
      this.loadCaseTypeList();
      this.selectedCaseTypes = [];
  }


    ngOnInit(): void {
      this.caseTypesFormGroup = this.initializeForm();
      this.selectedCaseTypes = this.bookingPersistService.selectedCaseTypes || [];
        this.clearSelection.subscribe(x => {
            this.onClear();
        });
    }

    onClear(): void {
        const searchCriteriaEntered =
            (this.selectedCaseTypes && this.selectedCaseTypes.length > 0);
        if (searchCriteriaEntered) {
            this.selectedCaseTypes = [];
            this.caseTypesFormGroup.reset();
        }
    }

    private initializeForm(): FormGroup {
      return this.formBuilder.group({
            selectedCaseTypes: [this.bookingPersistService.selectedCaseTypes || []],
        });
    }

    private loadCaseTypeList(): void {
        const self = this;
        const distinct = (value, index, array) => array.indexOf(value) === index;
        this.videoHearingService.getHearingTypes().subscribe(
            (data: HearingTypeResponse[]) => {
                this.caseTypes = [
                    ...Array.from(
                        data
                            .map(item => item.group)
                            .filter(distinct)
                            .sort()
                    )
                ];
                this.logger.debug(`${this.loggerPrefix} Updating list of case-types.`, { caseTypes: data.length });
            },
            error => self.handleListError(error, 'case types')
        );
    }

    private handleListError(err, type) {
        this.logger.error(`${this.loggerPrefix} Error getting ${type} list`, err, type);
        this.error = true;
    }

    onSelect($event: string[]) {
        this.selectedCaseTypes = this.caseTypesFormGroup.value['selectedCaseTypes'];
        this.selectedCaseTypesEmitter.emit(this.selectedCaseTypes);
    }
}
