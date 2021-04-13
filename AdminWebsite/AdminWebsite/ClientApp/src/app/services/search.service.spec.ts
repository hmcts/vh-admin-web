import { SearchService } from './search.service';
import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';
import { BHClient, PersonResponse } from './clients/api-client';

const participantList: PersonResponse[] = JSON.parse(
    `
    [
      {
        "id": 1,
        "contact_email": "vb.email1@hmcts.net",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "photelephone_numberne": "1111222222",
        "username": "vb.email1@hmcts.net"
      },
      {
        "id": 2,
        "contact_email": "vb.email2@hmcts.net",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "telephone_number": "1111222222",
        "username": "vb.email2@hmcts.net"
      }
    ]
    `
);
let clientApiSpy: jasmine.SpyObj<BHClient>;

describe('SearchService', () => {
    clientApiSpy = jasmine.createSpyObj('BHClient', ['postPersonBySearchTerm']);
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [{ provide: BHClient, useValue: clientApiSpy }]
        });
    });

    it('should return result', inject([SearchService], (service: SearchService) => {
        const terms = 'abc';
        clientApiSpy.postPersonBySearchTerm.and.returnValue(of(participantList));
        service.participantSearch(of(terms), 'Appellant').subscribe(x => expect(x).toBeTruthy());
    }));
    it('should method searchEntries not call api and return empty array', inject([SearchService], (service: SearchService) => {
        const terms = 'ab';
        service.searchEntries(terms).subscribe(x => expect(x.length).toBe(0));
    }));
    it('should method searchEntries call api and return persons response array', inject([SearchService], (service: SearchService) => {
        const terms = 'abc';
        clientApiSpy.postPersonBySearchTerm.and.returnValue(of(participantList));
        service.searchEntries(terms).subscribe(x => expect(x.length).toBe(2));
    }));
    it('should return title list', inject([SearchService], (service: SearchService) => {
        const list = service.TitleList;
        expect(list).toBeTruthy();
        expect(list.length).toBeGreaterThan(0);
    }));
});
