import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllocateHearingsService } from '../../services/allocate-hearings.service';
import { AllocationHearingsResponse } from '../../services/clients/api-client';

@Component({
    selector: 'app-allocate-hearings',
    templateUrl: './allocate-hearings.component.html',
    styleUrls: ['./allocate-hearings.component.css']
})
export class AllocateHearingsComponent implements OnInit {
    @Input() isVhTeamLeader: boolean;
    form: FormGroup;
    allocateHearingsDetailOpen: boolean;
    hearings: AllocationHearingsResponse[];
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
            const fromDt = params['fromDt'];
            const toDt = params['toDt'] ?? null;
            if (fromDt) {
                this.allocateHearingsDetailOpen = true;
                this.form.setValue({ fromDate: fromDt, toDate: toDt, userName: null, caseType: null, caseNumber: null });
                this.searchForHearings();
            }
        });
    }

    searchForHearings() {
        const retrieveDate = (date: any): Date => (date === '' || date === undefined ? null : new Date(date));

        const fromDate = retrieveDate(this.form.value.fromDate);
        const toDate = retrieveDate(this.form.value.toDate);
        const cso = this.form.value.userName;
        const caseNumber = this.form.value.caseType;
        const caseType = this.form.value.caseNumber;

        this.allocateService
            .getAllocationHearings(fromDate, toDate, cso, caseType, caseNumber)
            .subscribe(result => (this.hearings = result));
    }
}
