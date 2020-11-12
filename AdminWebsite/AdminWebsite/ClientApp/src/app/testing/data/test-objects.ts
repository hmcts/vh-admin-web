import { HearingTypeResponse, HearingVenueResponse, JudgeResponse } from 'src/app/services/clients/api-client';

export class MockValues {
    static HearingTypesList: HearingTypeResponse[] = JSON.parse(
        `
    [
      {
        "code": "BTA",
        "group": "Tax",
        "id": 1,
        "name": "Basic Tax Appeals"
      },
      {
        "code": "SAJ",
        "group": "Civil Money Claims",
        "id": 2,
        "name": "Application to Set Aside Judgement (SAJ)"
      },
      {
        "code": "FDAH",
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
        "code": "BTA",
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
           "name":"Manchester Civil Justice Centre"
        },
        {
           "id":2,
           "name":"Birmingham Civil Justice Centre"
        }
     ]`
    );

    static Judges: JudgeResponse[] = JSON.parse(
        `[
        {
          "first_name": "John",
          "last_name": "Doe",
          "display_name": "John Doe",
          "email": "John.Doe@madeupemail.com"
        },
        {
           "first_name": "John2",
           "last_name": "Doe",
           "display_name": "John2 Doe",
           "email": "John2.Doe@madeupemail.com"
        },
        {
           "first_name": "John3",
           "last_name": "Doe",
           "display_name": "John3 Doe",
           "email": "John3.Doe@madeupemail.com"
        },
        {
           "first_name": "John4",
           "last_name": "Doe",
           "display_name": "John4 Doe",
           "email": "John4.Doe@madeupemail.com"
        }
     ]`
    );
}
