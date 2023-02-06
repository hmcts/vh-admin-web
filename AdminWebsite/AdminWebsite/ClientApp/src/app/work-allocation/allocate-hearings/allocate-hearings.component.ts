import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllocateHearingsService } from '../../services/allocate-hearings.service';
import { AllocationHearingsResponse } from '../../services/clients/api-client';
import { JusticeUsersMenuComponent } from '../../shared/menus/justice-users-menu/justice-users-menu.component';
import { CaseTypesMenuComponent } from '../../shared/menus/case-types-menu/case-types-menu.component';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { AllocateHearingModel } from './models/allocate-hearing.model';

@Component({
    selector: 'app-allocate-hearings',
    templateUrl: './allocate-hearings.component.html',
    styleUrls: ['./allocate-hearings.component.scss']
})
export class AllocateHearingsComponent implements OnInit {
    constructor(private route: ActivatedRoute, private fb: FormBuilder, private allocateService: AllocateHearingsService) {
        this.form = fb.group({
            fromDate: ['', Validators.required],
            toDate: [''],
            userName: [''],
            caseType: [''],
            caseNumber: [''],
            isUnallocated: [false]
        });
    }
    @ViewChild(JusticeUsersMenuComponent) csoMenu: JusticeUsersMenuComponent;
    @ViewChild('csoAllocatedMenu', { static: false, read: JusticeUsersMenuComponent }) csoAllocatedMenu: JusticeUsersMenuComponent;
    @ViewChild(CaseTypesMenuComponent) caseTypeMenu: CaseTypesMenuComponent;
    form: FormGroup;
    allocateHearingsDetailOpen: boolean;
    originalHearings: AllocationHearingsResponse[];
    allocationHearingViewModel: AllocateHearingModel = new AllocateHearingModel([]);
    caseTypeDropDownValues: string[];
    csoDropDownValues: string[];
    displayMessage = false;
    message: string;
    faExclamation = faCircleExclamation;
    private filterSize = 20;
    dropDownUserLabelAllocateTo = 'Allocate to';

    allChecked = false;

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
    }

    searchForHearings() {
        const retrieveDate = (date: any): Date => (date === null || date === '' ? null : new Date(date));

        const fromDate = retrieveDate(this.form.value.fromDate);
        const toDate = retrieveDate(this.form.value.toDate);
        const caseNumber = this.form.value.caseNumber;
        const cso = this.csoDropDownValues;
        const caseType = this.caseTypeDropDownValues;
        const isUnallocated = this.form.value.isUnallocated;

        this.allocateService
            .getAllocationHearings(fromDate, toDate, cso, caseType, caseNumber, isUnallocated)
            .subscribe(result => this.displayResults(result));
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
        if (!this.displayMessage || this.allocationHearingViewModel.hasSelectedHearings) {
            this.clearMessage();
        }
        return this.displayMessage && !this.allocationHearingViewModel.hasSelectedHearings;
    }

    clearMessage() {
        this.displayMessage = false;
        this.message = '';
    }

    selectedCaseTypesEmitter($event: string[]) {
        this.caseTypeDropDownValues = $event;
    }

    selectedUsersEmitter($event: string[]) {
        this.csoDropDownValues = $event;
    }

    selectedAllocatedUsersEmitter(justiceUserId: string) {
        if (justiceUserId) {
            // should find a better way to pull in the username because first emit doesn't have it
            const username = this.csoAllocatedMenu?.selectedLabel;
            this.allocationHearingViewModel.assignCsoToSelectedHearings(username, justiceUserId);
        } else {
            // without a selected CSO, unset selection
            this.toggleAll(false);
        }
    }

    private clearSelectedHearings() {
        this.allocationHearingViewModel.uncheckAllHearingsAndRevert();
    }

    private displayResults(result: AllocationHearingsResponse[]) {
        this.originalHearings = result.slice(0, this.filterSize);
        this.allocationHearingViewModel = new AllocateHearingModel(this.originalHearings);

        if (result.length > this.filterSize) {
            this.displayMessage = true;
            this.message = `Showing only ${this.filterSize} Records, For more records please apply filter`;
        } else if (result.length === 0) {
            this.displayMessage = true;
            this.message = 'There are no records found';
        } else {
            this.displayMessage = false;
        }
        this.clearSelectedHearings();
    }

    cancelAllocation() {
        this.toggleAll(false);
        this.csoAllocatedMenu.clear();
        this.clearSelectedHearings();
    }

    confirmAllocation() {
        const csoId = this.csoAllocatedMenu?.selectedItems as string;
        this.allocateService.setAllocationToHearings(this.allocationHearingViewModel.selectedHearingIds, csoId).subscribe(
            result => this.updateTableWithAllocatedCso(result),
            error => {
                this.displayMessage = true;
                this.message = error?.response ?? 'There was an unknown error.';
            }
        );
    }

    toggleAll(checkAll: boolean) {
        if (checkAll) {
            this.allocationHearingViewModel.checkAllHearings();
            const csoUsername = this.csoAllocatedMenu?.selectedLabel;
            // safe to cast to string
            const csoId = this.csoAllocatedMenu?.selectedItems as string;
            if (csoUsername && csoId) {
                this.allocationHearingViewModel.assignCsoToSelectedHearings(csoUsername, csoId);
            }
        } else {
            this.allocationHearingViewModel.uncheckAllHearingsAndRevert();
        }
        this.allChecked = this.allocationHearingViewModel.areAllChecked;
    }

    private updateTableWithAllocatedCso(updatedHearings: AllocationHearingsResponse[]) {
        this.allocationHearingViewModel.updateHearings(updatedHearings);
        this.clearSelectedHearings();
        this.csoAllocatedMenu.clear();
        this.displayMessage = true;
        this.message = `Hearings have been updated.`;
    }

    selectHearing(checked: boolean, hearing_id: string) {
        const csoUsername = this.csoAllocatedMenu?.selectedLabel;
        // safe to cast to string
        const csoId = this.csoAllocatedMenu?.selectedItems as string;

        if (checked) {
            this.allocationHearingViewModel.checkHearing(hearing_id);
            if (csoUsername) {
                this.allocationHearingViewModel.assignCsoToSelectedHearings(csoUsername, csoId);
            }
        } else {
            this.allocationHearingViewModel.uncheckHearingAndRevert(hearing_id);
        }

        this.allChecked = this.allocationHearingViewModel.areAllChecked;
    }
}
