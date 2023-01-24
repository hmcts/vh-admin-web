import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllocationHearingsResponse } from '../../services/clients/api-client';
import { JusticeUsersMenuComponent } from '../../shared/menus/justice-users-menu/justice-users-menu.component';
import { CaseTypesMenuComponent } from '../../shared/menus/case-types-menu/case-types-menu.component';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { AllocateHearingsService } from '../services/allocate-hearings.service';
import { DateAndTimeService } from '../../services/date-and-time.service';

@Component({
    selector: 'app-allocate-hearings',
    templateUrl: './allocate-hearings.component.html',
    styleUrls: ['./allocate-hearings.component.scss']
})
export class AllocateHearingsComponent implements OnInit {
    @ViewChild(JusticeUsersMenuComponent) csoMenu: JusticeUsersMenuComponent;
    @ViewChild(CaseTypesMenuComponent) caseTypeMenu: CaseTypesMenuComponent;
    form: FormGroup;
    allocateHearingsDetailOpen: boolean;
    hearings: AllocationHearingsResponse[];
    caseTypeDropDownValues: string[];
    csoDropDownValues: string[];
    displayMessage = false;
    message: string;
    faExclamation = faCircleExclamation;
    private filterSize = 20;
    constructor(
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private allocateService: AllocateHearingsService,
        public dateAndTimeService: DateAndTimeService
    ) {
        this.form = fb.group({
            fromDate: ['', Validators.required],
            toDate: [''],
            userName: [''],
            caseType: [''],
            caseNumber: [''],
            isUnallocated: [false]
        });
    }

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
    }
}
