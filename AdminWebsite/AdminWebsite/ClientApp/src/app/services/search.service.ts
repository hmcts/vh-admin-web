import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { IDropDownModel } from '../common/model/drop-down.model';
import { ParticipantModel } from '../common/model/participant.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // for testing, should be removed

  ParticipantList: ParticipantModel[] =
    [
      {
        email: 'vb.email1@go.couk',
        role: 'Citizen',
        title: 'Mrs',
        first_name: 'Alis',
        last_name: 'Smith',
        phone: '1111222222',
        display_name: 'Alis',
      },
      {
        email: 'email2@go.couk',
        role: 'Citizen',
        title: 'Mrs',
        first_name: 'Rob',
        last_name: 'Smith',
        phone: '455576867876',
        display_name: 'Alis',
      },
      {
        email: 'email3@go.couk',
        role: 'Citizen',
        title: 'Mrs',
        first_name: 'Alis',
        last_name: 'Smith',
        phone: '1111222222',
        display_name: 'Alis',
      },
      {
        email: 'email4@go.couk',
        role: 'Citizen',
        title: 'Mrs',
        first_name: 'Alis',
        last_name: 'Smith',
        phone: '1111222222',
        display_name: 'Alis',
      },
      {
        email: 'email5@go.couk',
        role: 'Citizen',
        title: 'Mrs',
        first_name: 'Alis',
        last_name: 'Smith',
        phone: '1111222222',
        display_name: 'Alis',
      }
    ];
  // testing end

  TitleList: IDropDownModel[] =
    [
      {
        value: 'Please Select'
      },
      {
        value: 'Mr'
      },
      {
        value: 'Mrs'
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


  // ToDo should be change to Hearing API
  baseUrl = 'http://localhost:5000';
  queryUrl = '?search=';

  constructor(private http: HttpClient) { }

  search(terms: Observable<string>) {
    return terms.pipe(debounceTime(400))
      .pipe(distinctUntilChanged())
      .pipe(switchMap(term => this.searchEntries(term)));
  }

  searchEntries(term) {
    // TODO should call Hearing API to find participants with email that match term.
    let allResults: ParticipantModel[] = null;
    if (term.length > 2) {
      const findEmail = this.ParticipantList.find(s => s.email.includes(term));
      allResults = term && term.length > 0 && findEmail ? this.ParticipantList : allResults;
    }
    return of(allResults);
  }


}
