import { Component, OnInit, ViewChild } from '@angular/core';
import { AllocateHearingsService } from '../services/allocate-hearings.service';
import { AllocationHearingsResponse, HearingTypeResponse, JusticeUserResponse } from '../../services/clients/api-client';
import { JusticeUsersMenuComponent } from '../../shared/menus/justice-users-menu/justice-users-menu.component';
import { CaseTypesMenuComponent } from '../../shared/menus/case-types-menu/case-types-menu.component';
import { faCircleExclamation, faHourglassStart, faTriangleExclamation, faClock } from '@fortawesome/free-solid-svg-icons';
import { AllocateHearingModel } from './models/allocate-hearing.model';
import { Transform } from '@fortawesome/fontawesome-svg-core';
import { Constants } from 'src/app/common/constants';
import { DatePipe } from '@angular/common';
import { MenuComponent, MenuItem } from 'src/app/shared/menus/menu/menu.component';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { Constants } from 'src/app/common/constants';
import { BookingPersistService } from 'src/app/services/bookings-persist.service';

@Component({
    selector: 'app-allocate-hearings',
    templateUrl: './allocate-hearings.component.html',
    styleUrls: ['./allocate-hearings.component.scss']
})
export class AllocateHearingsComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private allocateService: AllocateHearingsService,
        private datePipe: DatePipe,
        private justiceUserService: JusticeUsersService,
        private videoHearingService: VideoHearingsService,
        private bookingPersistService: BookingPersistService
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
    @ViewChild(JusticeUsersMenuComponent) csoMenu: JusticeUsersMenuComponent;
    @ViewChild('csoAllocatedMenu', { static: false, read: JusticeUsersMenuComponent }) csoAllocatedMenu: JusticeUsersMenuComponent;
    @ViewChild('csoFilterMenu', { static: false, read: JusticeUsersMenuComponent }) csoFilterMenu: JusticeUsersMenuComponent;

    @ViewChild('csoAllocatedMenu2', { static: false, read: MenuComponent }) csoAllocatedMenu2: MenuComponent;
    @ViewChild('csoFilterMenu2', { static: false, read: MenuComponent }) csoFilterMenu2: MenuComponent;

    @ViewChild(CaseTypesMenuComponent) caseTypeMenu: CaseTypesMenuComponent;
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
    private filterSize = 20;
    dropDownUserLabelAllocateTo = 'Allocate to';
    todayDate: Date;
    dateFormat = 'yyyy-MM-dd';

    justiceUsersMenuItems: MenuItem[];
    selectedJusticeUserIds: string[] = [];
    caseTypesMenuItems: MenuItem[];

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

        this.form.get('isUnallocated').valueChanges.subscribe(val => {
            this.onIsAllocatedCheckboxChanged(val);
        });

        this.justiceUserService.retrieveJusticeUserAccounts().subscribe((data: JusticeUserResponse[]) => {
            this.justiceUsersMenuItems = data.map(item => ({
                label: item.full_name,
                entityId: item.id,
                data: item.username,
                ariaLabel: item.first_name
            }));
        });

        this.selectedJusticeUserIds = this.bookingPersistService.selectedUsers;

        const distinct = (value, index, array) => array.indexOf(value) === index;
        this.videoHearingService.getHearingTypes().subscribe((data: HearingTypeResponse[]) => {
            this.caseTypesMenuItems = data
                .map(item => item.group)
                .filter(distinct)
                .sort()
                .map(group => ({ entityId: group, label: group }));
        });
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
        console.log(':::: cso', cso);
        console.log(':::: filter menu', this.csoFilterMenu.selectedItems);
        console.log(':::: filter2 menu', this.csoFilterMenu2.selectedItems);
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

        this.csoMenu.clear();
        this.caseTypeMenu.clear();
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

    onCaseTypeSelected($event: string[]) {
        console.log(':::: onCaseTypeSelected', $event);
        this.caseTypeDropDownValues = $event;
        console.log('caseTypeDropDownValues', this.caseTypeDropDownValues);
    }

    onCaseTypeSelected2($event: MenuItem[]) {
        console.log(':::: onCaseTypeSelected2', $event);
        this.caseTypeDropDownValues = $event.map(x => x.entityId);
        console.log('caseTypeDropDownValues2', this.caseTypeDropDownValues);
    }

    onJusticeUserForFilterSelected(selectedCsoIds: string[]) {
        console.log(':::: onJusticeUserForFilterSelected', selectedCsoIds);
        this.csoDropDownValues = selectedCsoIds;
        console.log(':::: csoDropDownValues', this.csoDropDownValues);
        if (selectedCsoIds.length > 0) {
            this.form.get('isUnallocated').setValue(false);
        }
    }

    onJusticeUserForFilterSelected2(selectedCsoIds: MenuItem[]) {
        console.log(':::: onJusticeUserForFilterSelected2', selectedCsoIds);
        // this.csoDropDownValues = selectedCsoIds.map(x => x.entityId);
        console.log(':::: csoDropDownValues2', this.csoDropDownValues);
        if (selectedCsoIds.length > 0) {
            this.form.get('isUnallocated').setValue(false);
        }
    }

    onIsAllocatedCheckboxChanged2(checked: boolean) {
        if (checked) {
            this.csoFilterMenu2.clear();
            this.csoFilterMenu2.disable();
        } else {
            this.csoFilterMenu2.enable();
        }
    }

    onIsAllocatedCheckboxChanged(checked: boolean) {
        if (checked) {
            this.csoFilterMenu.clear();
            this.csoFilterMenu.enabled(false);
        } else {
            this.csoFilterMenu.enabled(true);
        }
    }

    onJusticeUserForAllocationSelected(justiceUserId: string) {
        this.clearHearingUpdatedMessage();
        console.log(':::: onJusticeUserForAllocationSelected', justiceUserId);
        if (justiceUserId) {
            const username = this.csoAllocatedMenu?.selectedLabel;
            console.log(':::: USER', username);
            this.attemptToAssignCsoToSelectedHearings(justiceUserId, username);
        } else {
            // without a selected CSO, unset selection
            this.clearMessage();
            this.toggleAll(false);
        }
    }

    onJusticeUserForAllocationSelected2(selectedItem: MenuItem) {
        console.log(':::: onJusticeUserForAllocationSelected2', selectedItem);
        if (selectedItem) {
            const username = selectedItem.data;
            const justiceUserId = selectedItem.entityId;
            console.log(':::: USER2', username);
            this.attemptToAssignCsoToSelectedHearings(justiceUserId, username);
        } else {
            // without a selected CSO, unset selection
            this.clearMessage();
            this.toggleAll(false);
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
        this.toggleAll(false);
        this.csoAllocatedMenu2.clear();
        this.clearMessage();
        this.allocationHearingViewModel.uncheckAllHearingsAndRevert();
    }

    confirmAllocation() {
        this.clearHearingUpdatedMessage();
        const csoId = this.csoAllocatedMenu2?.selectedItems[0].entityId;
        this.allocateService.allocateCsoToHearings(this.allocationHearingViewModel.selectedHearingIds, csoId).subscribe(
            result => this.updateTableWithAllocatedCso(result),
            () => {
                this.updateMessageAndDisplay('One or more hearings could not be allocated successfully.');
                this.searchForHearings(true);
            }
        );
    }

    toggleAll(checkAll: boolean) {
        if (checkAll) {
            this.allocationHearingViewModel.checkAllHearings();
            const csoUsername = this.csoAllocatedMenu?.selectedLabel;
            // safe to cast to string
            const csoId = this.csoAllocatedMenu?.selectedItems as string;
            this.attemptToAssignCsoToSelectedHearings(csoId, csoUsername);
        } else {
            this.allocationHearingViewModel.uncheckAllHearingsAndRevert();
        }
    }

    private updateTableWithAllocatedCso(updatedHearings: AllocationHearingsResponse[]) {
        this.allocationHearingViewModel.updateHearings(updatedHearings);
        this.allocationHearingViewModel.uncheckAllHearingsAndRevert();
        this.csoAllocatedMenu.clear();
        this.updateMessageAndDisplay(Constants.AllocateHearings.ConfirmationMessage);
    }

    selectHearing(checked: boolean, hearing_id: string) {
        if (checked) {
            this.clearHearingUpdatedMessage();
            const csoUsername = this.csoAllocatedMenu?.selectedLabel;
            // safe to cast to string
            const csoId = this.csoAllocatedMenu?.selectedItems as string;

            this.allocationHearingViewModel.checkHearing(hearing_id);
            this.attemptToAssignCsoToSelectedHearings(csoId, csoUsername);
        } else {
            this.allocationHearingViewModel.uncheckHearingAndRevert(hearing_id);
        }
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
