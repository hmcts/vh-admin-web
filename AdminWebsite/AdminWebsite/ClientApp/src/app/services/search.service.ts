import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IDropDownModel } from '../common/model/drop-down.model';
import { BHClient, JudgeResponse, PersonResponseV2 } from './clients/api-client';
import { Constants } from '../common/constants';
import { VHParticipant } from '../common/model/vh-participant';
import { mapJudgeResponseToVHParticipant, mapPersonResponseToVHParticipant } from '../common/model/api-contract-to-client-model-mappers';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private readonly minimumSearchLength = 3;

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
            value: 'Mx'
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

    constructor(private readonly bhClient: BHClient) {}

    participantSearch(term: string, hearingRole: string): Observable<Array<VHParticipant>> {
        const allResults: VHParticipant[] = [];
        if (term.length >= this.minimumSearchLength) {
            if (hearingRole === Constants.HearingRoles.Judge) {
                return this.searchJudgeAccounts(term).pipe(map(judges => judges.map(judge => mapJudgeResponseToVHParticipant(judge))));
            } else {
                const persons$ = this.searchEntries(term);
                return persons$.pipe(map(persons => persons.map(person => mapPersonResponseToVHParticipant(person))));
            }
        } else {
            return of(allResults);
        }
    }

    searchEntries(term): Observable<Array<PersonResponseV2>> {
        return this.bhClient.postPersonBySearchTerm(term);
    }

    searchJudgeAccounts(term): Observable<Array<JudgeResponse>> {
        return this.bhClient.postJudgesBySearchTerm(term);
    }
}
