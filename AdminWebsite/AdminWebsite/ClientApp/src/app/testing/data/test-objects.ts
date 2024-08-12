import { HearingTypeResponse, HearingVenueResponse, JudgeResponse } from 'src/app/services/clients/api-client';

export class MockValues {
    static HearingTypesList: HearingTypeResponse[] = JSON.parse(
        `
    [
      {
        "code": null,
        "service_id": "BTA",
        "group": "Tax",
        "id": 1,
        "name": "Basic Tax Appeals"
      },
      {
        "code": null,
        "service_id": "ZZY1",
        "group": "Generic",
        "id": 2,
        "name": "Automated Test"
      },
      {
        "code": null,
        "service_id": "FDAH",
        "group": "Financial Remedy",
        "id": 3,
        "name": "First Directions Appointment Hearing"
      }
    ]
    `
    );

    static HearingTypesSingle: HearingTypeResponse[] = JSON.parse(
        `
    [
      {
        "code": null,
        "service_id": "BTA",
        "group": "Tax",
        "id": 1,
        "name": "Basic Tax Appeals"
      }
    ]
    `
    );

    static Courts: HearingVenueResponse[] = JSON.parse(
        `[
        {
           "id":1,
           "name":"Manchester Civil Justice Centre",
           "code": "326944"
        },
        {
           "id":2,
           "name":"Birmingham Civil Justice Centre",
           "code": "231596"
        }
     ]`
    );

    static Judges: JudgeResponse[] = JSON.parse(
        `[
        {
          "first_name": "John",
          "last_name": "Doe",
          "display_name": "John Doe",
          "email": "John.Doe@hmcts.net"
        },
        {
           "first_name": "John2",
           "last_name": "Doe",
           "display_name": "John2 Doe",
           "email": "John2.Doe@hmcts.net"
        },
        {
           "first_name": "John3",
           "last_name": "Doe",
           "display_name": "John3 Doe",
           "email": "John3.Doe@hmcts.net"
        },
        {
           "first_name": "John4",
           "last_name": "Doe",
           "display_name": "John4 Doe",
           "email": "John4.Doe@hmcts.net"
        }
     ]`
    );
}
