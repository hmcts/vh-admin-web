import { Injectable } from '@angular/core';
import { Observable, of, zip } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';

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

    private judgeRole = 'Judge';
    private judiciaryRoles = ['Panel Member', 'Winger']; // TODO store somewhere more central as these are frequently used
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

    constructor(private bhClient: BHClient, private judgeDataService: JudgeDataService) {}

    search(term: string, role: string): Observable<Array<PersonResponse>> {
        if (this.judgeRole === role) {
            return zip(this.searchJudiciaryEntries(term), this.searchJudges(term)).pipe(map(([judicaryEntries, judges]) => {
                console.log('judicary', judicaryEntries);
                console.log('judges', judges);
                const combined = [...judicaryEntries, ...judges].sort((a, b) => a.username.localeCompare(b.username));
                console.log(combined);
                return combined;
            }));
        }
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

    searchJudges(term): Observable<PersonResponse[]> {
        return this.judgeDataService.searchJudgesByEmail(term).pipe(map(judges => {
            return judges.map(judge => {
                const judgeAsPerson = new PersonResponse();
                judgeAsPerson.first_name = judge.first_name;
                judgeAsPerson.last_name = judge.last_name;
                // judgeAsPerson.contact_email = judge.email;
                judgeAsPerson.username = judge.email ? judge.email : null; // TODO confirm
                return judgeAsPerson;
            });
        }));
    }
}
