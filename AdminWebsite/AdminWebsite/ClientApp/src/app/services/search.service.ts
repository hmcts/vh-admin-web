import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { IDropDownModel } from '../common/model/drop-down.model';
import { ParticipantModel } from '../common/model/participant.model';
import { BHClient, PersonResponse } from '../services/clients/api-client';
import { Constants } from '../common/constants';
import { JudgeDataService } from '../booking/services/judge-data.service';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    // empty since the functionality is yet to be implemented
    ParticipantList: ParticipantModel[] = [];

    private judiciaryRoles = ['Panel Member', 'Winger', 'Judge']; // TODO store somewhere more central as these are frequently used
    private minimumSearchLength = 3;

    TitleList: IDropDownModel[] = [
        {
            value: Constants.PleaseSelect
        },
        {
            value: 'Mr'
        },
        {
            value: 'Mrs'
        },
        {
            value: 'Miss'
        },
        {
            value: 'Ms'
        },
        {
            value: 'Rev'
        },
        {
            value: 'Dr'
        },
        {
            value: 'Lord'
        },
        {
            value: 'Lady'
        },
        {
            value: 'Sir'
        },
        {
            value: 'Right Hon'
        },
        {
            value: 'Viscount'
        },
        {
            value: 'Duke'
        },
        {
            value: 'Duchess'
        }
    ];

    constructor(
        private bhClient: BHClient,
        private judgeDataService: JudgeDataService,
    ) {}

    search(term: string, role: string): Observable<Array<PersonResponse>> {
        if (this.judiciaryRoles.includes(role)) {
            return this.searchJudiciaryEntries(term);
        } else {
            return this.searchEntries(term);
        }
    }

    searchEntries(term): Observable<Array<PersonResponse>> {
        const allResults: PersonResponse[] = [];
        if (term.length >= this.minimumSearchLength) {
            return this.bhClient.postPersonBySearchTerm(term);
        } else {
            return of(allResults);
        }
    }

    searchJudiciaryEntries(term): Observable<Array<PersonResponse>> {
        const allResults: PersonResponse[] = [];
        if (term.length >= this.minimumSearchLength) {
            return this.bhClient.postJudiciaryPersonBySearchTerm(term);
        } else {
            return of(allResults);
        }
    }

    searchJudges(term): Observable<Array<PersonResponse>> {
        this.judgeDataService.getJudges();
    }
}
