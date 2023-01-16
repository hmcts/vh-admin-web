import {Component, EventEmitter, Input, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllocateHearingsService } from '../../services/allocate-hearings.service';
import { AllocationHearingsResponse } from '../../services/clients/api-client';
import {JusticeUsersMenuComponent} from "../../shared/menus/justice-users-menu/justice-users-menu.component";
import {CaseTypesMenuComponent} from "../../shared/menus/case-types-menu/case-types-menu.component";

@Component({
    selector: 'app-allocate-hearings',
    templateUrl: './allocate-hearings.component.html',
    styleUrls: ['./allocate-hearings.component.scss']
})
export class AllocateHearingsComponent implements OnInit {
    @Input() isVhTeamLeader: boolean;
    @ViewChild(JusticeUsersMenuComponent) csoMenu:JusticeUsersMenuComponent;
    @ViewChild(CaseTypesMenuComponent) caseTypeMenu:CaseTypesMenuComponent;
    form: FormGroup;
    allocateHearingsDetailOpen: boolean;
    hearings: AllocationHearingsResponse[];
    caseTypeDropDownValues: string[];
    csoDropDownValues: string[];

    constructor(private route: ActivatedRoute, private fb: FormBuilder, private allocateService: AllocateHearingsService) {
        this.form = fb.group({
            fromDate: ['', Validators.required],
            toDate: [''],
            userName: [''],
            caseType: [''],
            caseNumber: ['']
        });
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const fromDt = params['fromDt'] ?? null;
            const toDt = params['toDt'] ?? null;
            if (fromDt) {
                this.allocateHearingsDetailOpen = true;
                this.form.setValue({ fromDate: fromDt, toDate: toDt, userName: null, caseType: null, caseNumber: null });
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

        this.allocateService
            .getAllocationHearings(fromDate, toDate, cso, caseType, caseNumber)
            .subscribe(result => this.hearings = result);
    }

    clear(){
        this.caseTypeDropDownValues = [];
        this.csoDropDownValues = [];

        this.csoMenu.clear();
        this.caseTypeMenu.clear();
    }

    selectedCaseTypesEmitter($event: string[]) {
        this.caseTypeDropDownValues = $event;
    }

    selectedUsersEmitter($event: string[]) {
        this.csoDropDownValues = $event;
    }
}
