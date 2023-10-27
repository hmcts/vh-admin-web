import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IDropDownModel } from '../common/model/drop-down.model';
import { ParticipantModel } from '../common/model/participant.model';
import { BHClient, JudgeResponse, PersonResponse } from '../services/clients/api-client';
import { Constants } from '../common/constants';
import { FeatureFlags, LaunchDarklyService } from './launch-darkly.service';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private minimumSearchLength = 3;
    private judiciaryRoles;

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

    constructor(private bhClient: BHClient, private featureToggleService: LaunchDarklyService) {
        this.featureToggleService.getFlag<boolean>(FeatureFlags.eJudFeature).subscribe(flagEnabled => {
            this.judiciaryRoles = flagEnabled ? Constants.JudiciaryRoles : [];
        });
    }

    participantSearch(term: string, hearingRole: string, caseRole: string = null): Observable<Array<ParticipantModel>> {
        const allResults: ParticipantModel[] = [];
        if (term.length >= this.minimumSearchLength) {
            if (hearingRole === Constants.HearingRoles.Judge) {
                return this.searchJudgeAccounts(term).pipe(map(judges => judges.map(judge => ParticipantModel.fromJudgeResponse(judge))));
            } else {
                let persons$: Observable<Array<PersonResponse>>;
                if (this.judiciaryRoles.includes(caseRole) || this.judiciaryRoles.includes(hearingRole)) {
                    persons$ = this.searchJudiciaryEntries(term);
                } else if (hearingRole === Constants.HearingRoles.StaffMember) {
                    persons$ = this.searchStaffMemberAccounts(term);
                } else {
                    persons$ = this.searchEntries(term);
                }
                return persons$.pipe(map(persons => persons.map(person => ParticipantModel.fromPersonResponse(person))));
            }
        } else {
            return of(allResults);
        }
    }

    searchEntries(term): Observable<Array<PersonResponse>> {
        return this.bhClient.postPersonBySearchTerm(term);
    }

    searchJudiciaryEntries(term): Observable<Array<PersonResponse>> {
        return this.bhClient.searchForJudiciaryPerson(term);
    }

    searchStaffMemberAccounts(term): Observable<Array<PersonResponse>> {
        return this.bhClient.getStaffMembersBySearchTerm(term);
    }

    searchJudgeAccounts(term): Observable<Array<JudgeResponse>> {
        return this.bhClient.postJudgesBySearchTerm(term);
    }
}
