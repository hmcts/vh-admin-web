import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllocateHearingsService } from '../../services/allocate-hearings.service';
import { AllocationHearingsResponse } from '../../services/clients/api-client';
import { JusticeUsersMenuComponent } from '../../shared/menus/justice-users-menu/justice-users-menu.component';
import { CaseTypesMenuComponent } from '../../shared/menus/case-types-menu/case-types-menu.component';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

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
    hearings: AllocationHearingsResponse[];
    caseTypeDropDownValues: string[];
    csoDropDownValues: string[];
    selectedHearings: string[] = [];
    csoUserToAllocate: string;
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
            .subscribe(result => this.filterResults(result));
    }

    clear() {
        this.hearings = this.originalHearings = [];
        this.caseTypeDropDownValues = [];
        this.csoDropDownValues = [];

        this.form.reset();

        this.csoMenu.clear();
        this.caseTypeMenu.clear();
    }

    messageCanBeDisplayed(): boolean {
        if (!this.displayMessage || this.selectedHearings.length !== 0) {
            this.clearMessage();
        }
        return this.displayMessage && this.selectedHearings.length === 0;
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
        this.csoUserToAllocate = justiceUserId;
        if (this.csoUserToAllocate) {
            if (this.csoAllocatedMenu?.selectedLabel) {
                this.updateSelectedHearingsWithCso(this.csoAllocatedMenu.selectedLabel);
            }
        } else {
            // reload the table
            this.searchForHearings();
            this.checkUncheckAll(false);
            this.uncheckAllCheckbox();
        }
    }

    private clearSelectedHearings() {
        this.selectedHearings = [];
        // this.uncheckAllCheckbox();
    }

    private filterResults(result: AllocationHearingsResponse[]) {
        this.originalHearings = result.slice(0, this.filterSize);
        this.hearings = this.originalHearings.map(val => Object.assign({}, val));
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
        this.checkUncheckAll(false);
        this.csoAllocatedMenu.clear();
        this.clearSelectedHearings();
    }

    confirmAllocation() {
        this.allocateService.setAllocationToHearings(this.selectedHearings, this.csoUserToAllocate).subscribe(
            result => {
                this.updateTableWithAllocatedCso(result);
            },
            error => {
                this.displayMessage = true;
                this.message = error;
            }
        );
    }

    checkUncheckAll(value: boolean) {
        this.allChecked = value;
        this.hearings.forEach(h => {
            const index: number = this.selectedHearings.indexOf(h.hearing_id);
            const checkbox = document.getElementById('hearing_' + h.hearing_id) as HTMLInputElement;
            checkbox.checked = value;
            debugger;
            if (value && index === -1) {
                this.selectedHearings.push(h.hearing_id);
            } else {
                this.revertHearingRow(h.hearing_id);
            }
        });
        if (!value) {
            this.clearSelectedHearings();
        }
    }

    private updateTableWithAllocatedCso(allocatedHearings: AllocationHearingsResponse[]) {
        debugger;
        const list: AllocationHearingsResponse[] = [];
        this.hearings.forEach(hearing => {
            const hrg = allocatedHearings.find(x => x.hearing_id === hearing.hearing_id);
            if (hrg) {
                list.push(hrg);
            } else {
                list.push(hearing);
            }
        });
        this.hearings = list;
        this.clearSelectedHearings();
        this.displayMessage = true;
        this.message = `Hearings have been updated.`;
    }

    selectHearing($event, hearing_id: string) {
        const checkBoxChecked = $event.target.checked;
        const index: number = this.selectedHearings.indexOf(hearing_id);
        if (checkBoxChecked) {
            if (index === -1) {
                this.selectedHearings.push(hearing_id);
                if (this.csoAllocatedMenu?.selectedLabel) {
                    this.updateSelectedHearingsWithCso(this.csoAllocatedMenu.selectedLabel);
                }
            }
        } else {
            if (index !== -1) {
                this.selectedHearings.splice(index, 1);
            }
            this.revertHearingRow(hearing_id);
        }

        this.allChecked = this.selectedHearings.length === this.hearings.length;
    }

    private updateSelectedHearingsWithCso(selectedLabel: string) {
        for (const hearing of this.hearings) {
            if (this.selectedHearings.includes(hearing.hearing_id)) {
                hearing.allocated_cso = selectedLabel;
            }
        }
        // this.selectedHearings.forEach(id => {
        //     const cell = document.querySelector('#cso_' + id);
        //     cell.innerHTML = selectedLabel;
        // });
    }

    private revertHearingRow(hearing_id: string) {
        const index = this.hearings.findIndex(x => x.hearing_id === hearing_id);
        this.hearings[index] = this.originalHearings.find(x => x.hearing_id === hearing_id);
        // const hearing = this.hearings.find(h => h.hearing_id === hearing_id);
        // if (hearing) {
        //     const cell = document.querySelector('#cso_' + hearing_id);
        //     cell.innerHTML = hearing.allocated_cso;
        // }
    }

    private uncheckAllCheckbox() {
        const checkbox = document.getElementById('select-all-hearings') as HTMLInputElement;
        checkbox.checked = false;
    }
}
