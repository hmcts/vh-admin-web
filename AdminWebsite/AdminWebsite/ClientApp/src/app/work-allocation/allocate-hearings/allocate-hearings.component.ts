import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllocateHearingsService } from '../../services/allocate-hearings.service';
import { AllocationHearingsResponse, ProblemDetails } from '../../services/clients/api-client';
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
    hearings: AllocationHearingsResponse[];
    hearingsAllocated: AllocationHearingsResponse[];
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
        this.hearings = [];
        this.caseTypeDropDownValues = [];
        this.csoDropDownValues = [];

        this.form.controls['fromDate'].setValue('');
        this.form.controls['toDate'].setValue('');
        this.form.controls['userName'].setValue('');
        this.form.controls['caseType'].setValue('');
        this.form.controls['caseNumber'].setValue('');
        this.form.controls['isUnallocated'].setValue(false);

        this.csoMenu.clear();
        this.caseTypeMenu.clear();
    }

    selectedCaseTypesEmitter($event: string[]) {
        this.caseTypeDropDownValues = $event;
    }

    selectedUsersEmitter($event: string[]) {
        this.csoDropDownValues = $event;
    }

    selectedAllocatedUsersEmitter($event: string) {
        this.csoUserToAllocate = $event;
        if ($event) {
            this.checkAllocationForCso(this.csoUserToAllocate);
            // change the label
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
    }

    private filterResults(result: AllocationHearingsResponse[]) {
        this.hearings = result.slice(0, this.filterSize);
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

    cancelAllocation() {}

    checkAllocationForCso(guid: string) {
        // TODO: send a request to api to check the user against the list of hearings selected for warnings
        // passing selectedHearings and guid for selected cso
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

    selectAllocateUser($event, hearing_id: string) {
        const checkBoxChecked = $event.target.checked;
        const index: number = this.selectedHearings.indexOf(hearing_id);
        if (checkBoxChecked) {
            if (index === -1) {
                this.selectedHearings.push(hearing_id);
            }
            if (this.csoAllocatedMenu?.selectedLabel) {
                this.updateSelectedHearingsWithCso(this.csoAllocatedMenu.selectedLabel);
            }
        } else {
            if (index !== -1) {
                this.selectedHearings.splice(index, 1);
            }
            this.revertHearingRow(hearing_id);
        }
    }

    private updateSelectedHearingsWithCso(selectedLabel: string) {
        this.selectedHearings.forEach(id => {
            const cell = document.querySelector('#cso_' + id);
            cell.innerHTML = selectedLabel;
        });
    }

    private revertHearingRow(hearing_id: string) {
        const hearing = this.hearings.find(h => h.hearing_id === hearing_id);
        if (hearing) {
            const cell = document.querySelector('#cso_' + hearing_id);
            cell.innerHTML = hearing.allocated_cso;
        }
    }

    private uncheckAllCheckbox() {
        const checkbox = document.getElementById('select-all-hearings') as HTMLInputElement;
        checkbox.checked = false;
    }
}
