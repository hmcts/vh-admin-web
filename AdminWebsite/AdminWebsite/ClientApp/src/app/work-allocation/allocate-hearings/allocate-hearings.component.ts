import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AllocateHearingsService } from '../services/allocate-hearings.service';
import { AllocationHearingsResponse, CaseTypeResponse, JusticeUserResponse } from '../../services/clients/api-client';
import { faCircleExclamation, faHourglassStart, faTriangleExclamation, faClock } from '@fortawesome/free-solid-svg-icons';
import { AllocateHearingItemModel, AllocateHearingModel } from './models/allocate-hearing.model';
import { Transform } from '@fortawesome/fontawesome-svg-core';
import { Constants } from 'src/app/common/constants';
import { DatePipe } from '@angular/common';
import { SelectComponent, SelectOption } from 'src/app/shared/select/select.component';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BookingPersistService } from 'src/app/services/bookings-persist.service';
import { map, takeUntil, tap } from 'rxjs/operators';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-allocate-hearings',
    templateUrl: './allocate-hearings.component.html',
    styleUrls: ['./allocate-hearings.component.scss']
})
export class AllocateHearingsComponent implements OnInit, OnDestroy {
    constructor(
        private readonly route: ActivatedRoute,
        private readonly fb: FormBuilder,
        private readonly allocateService: AllocateHearingsService,
        private readonly datePipe: DatePipe,
        private readonly justiceUserService: JusticeUsersService,
        private readonly referenceDataService: ReferenceDataService,
        private readonly bookingPersistService: BookingPersistService
    ) {
        this.form = fb.group({
            fromDate: ['', Validators.required],
            toDate: [''],
            userName: [''],
            caseType: [''],
            caseNumber: [''],
            isUnallocated: [false]
        });
        this.todayDate = new Date();
    }

    @ViewChild('selectAllocateCso', { static: false, read: SelectComponent }) selectAllocateCso: SelectComponent;
    @ViewChild('selectFilterCso', { static: false, read: SelectComponent }) selectFilterCso: SelectComponent;
    @ViewChild('selectCaseType', { static: false, read: SelectComponent }) selectCaseType: SelectComponent;

    form: FormGroup;
    allocateHearingsDetailOpen: boolean;
    allocationHearingViewModel: AllocateHearingModel = new AllocateHearingModel([]);
    caseTypeDropDownValues: string[];
    csoDropDownValues: string[];
    displayMessage = false;
    message: string;
    faExclamation = faCircleExclamation;
    triangleExclamation = faTriangleExclamation;
    hourGlassStart = faHourglassStart;
    faClock = faClock;
    customIconTransform: Transform = { rotate: 45 };
    private readonly filterSize = 20;
    todayDate: Date;
    dateFormat = 'yyyy-MM-dd';

    justiceUsersSelectOptions: SelectOption[];
    selectedJusticeUserIds: string[] = [];
    caseTypesSelectOptions: SelectOption[];
    selectedCaseTypeIds: string[] = [];

    private readonly destroy$ = new Subject<void>();

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const fromDt = params['fromDt'] ?? null;
            const toDt = params['toDt'] ?? null;
            if (fromDt) {
                this.allocateHearingsDetailOpen = true;
                this.form.setValue({
                    fromDate: fromDt,
                    toDate: toDt,
                    userName: null,
                    caseType: null,
                    caseNumber: null,
                    isUnallocated: true
                });
                this.searchForHearings();
            }
        });

        this.form
            .get('isUnallocated')
            .valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe(val => {
                if (val) {
                    this.onIsAllocatedCheckboxChecked();
                } else {
                    this.onIsAllocatedCheckboxUnchecked();
                }
            });

        this.selectedJusticeUserIds = this.bookingPersistService.selectedUsers;
        this.selectedCaseTypeIds = this.bookingPersistService.selectedCaseTypes;
        this.referenceDataService
            .getCaseTypes()
            .pipe(takeUntil(this.destroy$))
            .subscribe((data: CaseTypeResponse[]) => {
                this.caseTypesSelectOptions = data
                    .map(item => item.name)
                    .sort((a, b) => a.localeCompare(b))
                    .map(group => ({ entityId: group, label: group }));
            });

        this.justiceUserService.allUsers$
            .pipe(
                takeUntil(this.destroy$),
                map(users => users.filter(user => !user.deleted)),
                tap(() => this.selectFilterCso?.clear())
            )
            .subscribe((data: JusticeUserResponse[]) => {
                this.justiceUsersSelectOptions = data.map(item => ({
                    label: item.full_name,
                    entityId: item.id,
                    data: item.username,
                    ariaLabel: item.first_name
                }));
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    searchForHearings(keepExistingMessage: boolean = false) {
        const retrieveDate = (date: any): Date => (date === null || date === '' ? null : new Date(date));

        let fromDateValue = retrieveDate(this.form.value.fromDate);
        let toDate = retrieveDate(this.form.value.toDate);
        if (fromDateValue === null) {
            fromDateValue = new Date();
            this.form.patchValue({
                fromDate: this.datePipe.transform(this.todayDate, this.dateFormat)
            });
            toDate = new Date(new Date().setFullYear(this.todayDate.getFullYear() + 1));
            const dateString = this.datePipe.transform(toDate, this.dateFormat);
            this.form.patchValue({
                toDate: dateString
            });
        }

        const caseNumber = this.form.value.caseNumber;
        const cso = this.csoDropDownValues;
        const caseType = this.caseTypeDropDownValues;
        const isUnallocated = this.form.value.isUnallocated;

        this.allocateService
            .getAllocationHearings(fromDateValue, toDate, cso, caseType, caseNumber, isUnallocated)
            .subscribe(result => this.displayResults(result, keepExistingMessage));
    }

    clear() {
        this.allocationHearingViewModel = new AllocateHearingModel([]);
        this.caseTypeDropDownValues = [];
        this.csoDropDownValues = [];

        this.form.reset({
            fromDate: '',
            toDate: '',
            userName: '',
            caseType: '',
            caseNumber: '',
            isUnallocated: false
        });

        this.selectAllocateCso?.clear();
        this.selectFilterCso.clear();
        this.selectCaseType.clear();
    }

    messageCanBeDisplayed(): boolean {
        return this.displayMessage;
    }

    updateMessageAndDisplay(message: string) {
        this.message = message;
        this.displayMessage = true;
    }

    clearMessage() {
        this.displayMessage = false;
        this.message = '';
    }

    onCaseTypeSelected($event: SelectOption[]) {
        this.caseTypeDropDownValues = $event.map(x => x.entityId);
    }

    onJusticeUserForFilterSelected(selectedOptions: SelectOption[]) {
        this.csoDropDownValues = selectedOptions.map(x => x.entityId);
        if (selectedOptions.length > 0) {
            this.form.get('isUnallocated').setValue(false);
        }
    }

    onIsAllocatedCheckboxChecked() {
        this.selectFilterCso.clear();
        this.selectFilterCso.disable();
    }

    onIsAllocatedCheckboxUnchecked() {
        this.selectFilterCso.enable();
    }

    onJusticeUserForAllocationSelected(selectedItem?: SelectOption) {
        if (selectedItem) {
            const username = selectedItem.data;
            const justiceUserId = selectedItem.entityId;
            this.attemptToAssignCsoToSelectedHearings(justiceUserId, username);
        } else {
            // without a selected CSO, unset selection
            this.clearMessage();
            this.deselectAll();
        }
    }

    private attemptToAssignCsoToSelectedHearings(csoId: string, csoUsername: string) {
        if (!csoId || !csoUsername) {
            return;
        }
        this.allocationHearingViewModel.assignCsoToSelectedHearings(csoUsername, csoId);
    }

    private displayResults(result: AllocationHearingsResponse[], keepExistingMessage: boolean = false) {
        const originalHearings = result.slice(0, this.filterSize);
        this.allocationHearingViewModel = new AllocateHearingModel(originalHearings);
        this.allocationHearingViewModel.uncheckAllHearingsAndRevert();

        // if there is an error, refresh the data to capture partial updates but keep error message on screen
        if (keepExistingMessage) {
            return;
        }
        if (result.length > this.filterSize) {
            this.updateMessageAndDisplay(`Showing only ${this.filterSize} Records, For more records please apply filter`);
        } else if (result.length === 0) {
            this.updateMessageAndDisplay('There are no records found');
        } else {
            this.displayMessage = false;
        }
    }

    cancelAllocation() {
        this.deselectAll();
        this.selectAllocateCso.clear();
        this.clearMessage();
        this.allocationHearingViewModel.uncheckAllHearingsAndRevert();
    }

    confirmAllocation() {
        this.clearHearingUpdatedMessage();
        const selectedCso = this.selectAllocateCso?.selected as SelectOption;
        this.allocateService.allocateCsoToHearings(this.allocationHearingViewModel.selectedHearingIds, selectedCso.entityId).subscribe({
            next: result => this.updateTableWithAllocatedCso(result),
            error: () => {
                this.updateMessageAndDisplay('One or more hearings could not be allocated successfully.');
                this.searchForHearings(true);
            }
        });
    }

    toggleAll() {
        if (this.allocationHearingViewModel.areAllChecked) {
            this.deselectAll();
        } else {
            this.selectAll();
        }
    }

    selectAll() {
        this.allocationHearingViewModel.checkAllHearings();
        const selectedCso = this.selectAllocateCso?.selected as SelectOption;
        if (selectedCso) {
            const csoId = selectedCso.entityId;
            const csoUsername = selectedCso.data;
            this.attemptToAssignCsoToSelectedHearings(csoId, csoUsername);
        }
    }

    deselectAll() {
        this.allocationHearingViewModel.uncheckAllHearingsAndRevert();
    }

    private updateTableWithAllocatedCso(updatedHearings: AllocationHearingsResponse[]) {
        this.allocationHearingViewModel.updateHearings(updatedHearings);
        this.allocationHearingViewModel.uncheckAllHearingsAndRevert();
        this.selectAllocateCso.clear();
        this.updateMessageAndDisplay(Constants.AllocateHearings.ConfirmationMessage);
    }

    toggleSelectHearing(hearing: AllocateHearingItemModel) {
        if (hearing.checked) {
            this.deselectHearing(hearing.hearingId);
        } else {
            this.selectHearing(hearing.hearingId);
        }
    }

    selectHearing(hearing_id: string) {
        this.clearHearingUpdatedMessage();
        this.allocationHearingViewModel.checkHearing(hearing_id);

        const selectedCso = this.selectAllocateCso?.selected as SelectOption;
        if (selectedCso) {
            const csoId = selectedCso.entityId;
            const csoUsername = selectedCso.data;

            this.attemptToAssignCsoToSelectedHearings(csoId, csoUsername);
        }
    }

    deselectHearing(hearing_id: string) {
        this.allocationHearingViewModel.uncheckHearingAndRevert(hearing_id);
    }

    getConcurrentCountText(count: number): string {
        return `User has ${count} concurrent ${count > 1 ? 'hearings' : 'hearing'} allocated`;
    }

    hasHearingBeenUpdated(): boolean {
        return this.message === Constants.AllocateHearings.ConfirmationMessage;
    }

    clearHearingUpdatedMessage() {
        return this.hasHearingBeenUpdated() ? this.clearMessage() : null;
    }
}
