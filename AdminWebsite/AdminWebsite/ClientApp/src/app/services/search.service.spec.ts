import { SearchService } from './search.service';
import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';
import {
  BHClient, HearingDetailsResponse, CaseResponse2, PersonResponse
} from './clients/api-client';
const participantList: PersonResponse[] = JSON.parse(
  `
    [
      {
        "id": 1,
        "contact_email": "vb.email1@go.couk",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "photelephone_numberne": "1111222222",
        "username": "vb.email1@go.couk"
      },
      {
        "id": 2,
        "contact_email": "vb.email2@go.couk",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "telephone_number": "1111222222",
        "username": "vb.email2@go.couk"
      }
    ]
    `
);
let clientApiSpy: jasmine.SpyObj<BHClient>;

describe('SearchService', () => {
  clientApiSpy = jasmine.createSpyObj('BHClient', ['getPersonBySearchTerm']);
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [{ provide: BHClient, useValue: clientApiSpy }]
    });

    it('should return result', inject([SearchService], (service: SearchService) => {
      const terms = 'abc';
      clientApiSpy.getPersonBySearchTerm.and.returnValue(of(participantList));
      service.search(of(terms)).subscribe(x => expect(x).toBeTruthy());
    }));

  });
});
