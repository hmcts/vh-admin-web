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

    constructor(private bhClient: BHClient) {}

    participantSearch(term: string, role: string): Observable<Array<ParticipantModel>> {
        console.log('Role', role);
        if (role = this.judgeRole) {
            console.log('Judge', role);
            return this.searchJudgeAccounts(term).pipe(map(judges => {
                return judges.map(judge => {
                    return this.mapJudgeResponseToParticipantModel(judge);
                })
            }));
        } else {
            let persons$: Observable<Array<PersonResponse>>;
            if (this.judiciaryRoles.includes(role)) {
                persons$ = this.searchJudiciaryEntries(term);
            } else {
               persons$ = this.searchEntries(term);
            }
            return persons$.pipe(map(persons => {
                return persons.map(person => {
                    return this.mapPersonResponseToParticipantModel(person);
                });
            }));
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

    private mapPersonResponseToParticipantModel(p: PersonResponse): ParticipantModel { // TODO move somewhere else
        let participant: ParticipantModel;
        if (p) {
            participant = new ParticipantModel();
            participant.id = p.id;
            participant.title = p.title;
            participant.first_name = p.first_name;
            participant.middle_names = p.middle_names;
            participant.last_name = p.last_name;
            participant.username = p.username;
            participant.email = p.contact_email ?? p.username;
            participant.phone = p.telephone_number;
            participant.representee = '';
            participant.company = p.organisation;
        }

        return participant;
    }

    private mapJudgeResponseToParticipantModel(judge: JudgeResponse): ParticipantModel { // TODO move somewhere else
        let participant: ParticipantModel;
        if (judge) {
            participant = new ParticipantModel();
            participant.first_name = judge.first_name;
            participant.last_name = judge.last_name;
            participant.username = judge.email;
            participant.email = judge.email;
            participant.display_name = judge.display_name;
        }

        return participant;
    }
}
