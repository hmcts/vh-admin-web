import { AfterContentInit, Component, ViewChild } from '@angular/core';

import { AnswerQuestion, ChecklistModel } from '../common/model/checklist.model';
import { ChecklistService } from '../services/checklist.service';
import {
    ChecklistsHearingResponse,
    ChecklistsResponse,
    HearingParticipantCheckListResponse,
} from '../services/clients/api-client';
import { PaginationModel } from '../shared/pagination/pagination-model';
import { PaginationComponent } from '../shared/pagination/pagination.component';

@Component({
    selector: 'app-check-list',
    templateUrl: './check-list.component.html',
    styleUrls: ['./check-list.component.css']
})
export class CheckListComponent implements AfterContentInit {

    checklists: Array<ChecklistModel>;

    totalCount: number;
    totalPages: number;

    prevPageUrl: string;
    nextPageUrl: string;
    pageSize = 50;

    fromRecord: number;
    toRecord: number;
    page: number;

    loaded = false;
    error = false;

    @ViewChild(PaginationComponent)
    pagination: PaginationComponent;

    paginationData: PaginationModel;

    constructor(private checklistService: ChecklistService) {
    }

    async ngAfterContentInit(): Promise<any> {
        await this.loadPage(1, this.pageSize);
    }

    private async loadPage(page: number, pageSize: number): Promise<any> {
        this.loaded = false;
        this.error = false;
        this.checklistService.getChecklists(page, pageSize)
            .toPromise()
            .then(checklists => this.loadData(checklists))
            .catch(err => this.handleError(err));
    }

    private handleError(err) {
        console.error(err);
        this.error = true;
    }

    private loadData(checklistResponse: ChecklistsResponse) {
        this.totalCount = checklistResponse.total_count;
        this.page = checklistResponse.current_page;
        this.totalPages = checklistResponse.total_pages;
        this.pageSize = checklistResponse.page_size;

        this.paginationData = new PaginationModel(this.totalCount, this.page, this.totalPages, this.pageSize);

        // index hearings by id
        if (checklistResponse.hearings) {
            const hearings = checklistResponse.hearings.reduce((arr, hearing) => (arr[hearing.hearing_id] = hearing, arr), {});

            this.checklists = checklistResponse.checklists.map(checklist => this.mapChecklist(checklist, hearings[checklist.hearing_id]));
        }
        this.loaded = true;
    }

    private mapChecklist(checklist: HearingParticipantCheckListResponse, hearing: ChecklistsHearingResponse): ChecklistModel {
        const hearingCase = hearing.cases[0];
        const model = new ChecklistModel(
            checklist.participant_id,
            checklist.title,
            checklist.first_name,
            checklist.last_name,
            hearingCase ? hearingCase.number : '',
            hearingCase ? hearingCase.name : '',
            checklist.completed_date
        );
        model.Answers = checklist.question_answer_responses.map(answer =>
            new AnswerQuestion(answer.question_key, answer.answer, checklist.role, answer.notes));

        return model;
    }

    handleMoveNext() {
        this.loadPage(this.page + 1, this.pageSize);
    }

    handleMovePrevious() {
        this.loadPage(this.page - 1, this.pageSize);
    }

    handleMoveToStart() {
        this.loadPage(1, this.pageSize);
    }

    handleMoveToEnd() {
        this.loadPage(this.totalPages, this.pageSize);
    }

    changePageSize() {
        const newMaxPage = Math.ceil(this.totalCount / this.pageSize);
        const page = Math.min(newMaxPage, this.page);
        this.loadPage(page, this.pageSize);
    }

    expandItem(index) {
        this.checklists[index].IsExpanded = !this.checklists[index].IsExpanded;
    }

    async refreshRecords(): Promise<any> {
        await this.loadPage(1, this.pageSize);
    }
}

