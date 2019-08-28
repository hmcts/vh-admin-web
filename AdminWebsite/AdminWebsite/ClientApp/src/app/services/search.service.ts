import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { IDropDownModel } from '../common/model/drop-down.model';
import { ParticipantModel } from '../common/model/participant.model';
import { BHClient, PersonResponse } from '../services/clients/api-client';
import { Constants } from '../common/constants';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  // empty since the functionality is yet to be implemented
  ParticipantList: ParticipantModel[] = [];

  TitleList: IDropDownModel[] =
    [
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

  constructor(private bhClient: BHClient) { }

  search(terms: Observable<string>) {
    return terms.pipe(debounceTime(500))
      .pipe(distinctUntilChanged())
      .pipe(switchMap(term => this.searchEntries(term)));
  }

  searchEntries(term): Observable<Array<PersonResponse>> {
    const allResults: PersonResponse[] = [];
    if (term.length > 2) {
      return this.bhClient.getPersonBySearchTerm(term);
    }
    return of(allResults);
  }
}
