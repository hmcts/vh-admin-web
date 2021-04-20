import { Injectable } from '@angular/core';
import { Observable, of, zip } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { IDropDownModel } from '../common/model/drop-down.model';
import { ParticipantModel } from '../common/model/participant.model';
import { BHClient, JudgeResponse, PersonResponse } from '../services/clients/api-client';
import { Constants } from '../common/constants';
import { JudgeDataService } from '../booking/services/judge-data.service';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private judgeRole = Constants.Judge;
    private judiciaryRoles = Constants.JudiciaryRoles;
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

    constructor(private bhClient: BHClient) {}

    participantSearch(term: string, role: string): Observable<Array<ParticipantModel>> {
        if (role === this.judgeRole) {
            return this.searchJudgeAccounts(term).pipe(
                map(judges => {
                    return judges.map(judge => {
                        return ParticipantModel.fromJudgeResponse(judge);
                    });
                })
            );
        } else {
            let persons$: Observable<Array<PersonResponse>>;
            if (this.judiciaryRoles.includes(role)) {
                persons$ = this.searchJudiciaryEntries(term);
            } else {
                persons$ = this.searchEntries(term);
            }

            return persons$.pipe(
                map(persons => {
                    return persons.map(person => {
                        return ParticipantModel.fromPersonResponse(person);
                    });
                })
            );
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

    searchJudgeAccounts(term): Observable<Array<JudgeResponse>> {
        if (term.length >= this.minimumSearchLength) {
            return this.bhClient.postJudgesBySearchTerm(term);
        } else {
            return of([]);
        }
    }
}
