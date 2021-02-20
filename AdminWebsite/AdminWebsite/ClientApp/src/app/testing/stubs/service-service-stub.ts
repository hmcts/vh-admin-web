import { IDropDownModel } from 'src/app/common/model/drop-down.model';
import { Observable, of } from 'rxjs';
import { PersonResponse } from '../../services/clients/api-client';

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
export class SearchServiceStub {
    TitleList: IDropDownModel[] = [
        {
            value: 'Mrs'
        },
        {
            value: 'Miss'
        }
    ];

    search(terms: Observable<string>) {
        return of(participantList);
    }
}
