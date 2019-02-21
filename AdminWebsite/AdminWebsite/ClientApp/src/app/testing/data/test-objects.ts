import { HearingMediumResponse, HearingTypeResponse, CourtResponse, ParticipantDetailsResponse } from 'src/app/services/clients/api-client';

export class MockValues {
  static HearingMediums: HearingMediumResponse[] = JSON.parse(
    `[
            {
              "id": 1,
              "name": "Video"
            },
            {
              "id": 2,
              "name": "Telephone"
            },
            {
              "id": 3,
              "name": "Physical"
            },
            {
              "id": 4,
              "name": "Mixed"
            }
          ]`);

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
    `);

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
    `);

  static Courts: CourtResponse[] = JSON.parse(
    `[
        {
           "id":1,
           "room":"Room 1",
           "address":"Manchester Civil Justice Centre"
        },
        {
           "id":2,
           "room":"Room 2",
           "address":"Manchester Civil Justice Centre"
        },
        {
           "id":3,
           "room":"Room 1",
           "address":"Birmingham Civil Justice Centre"
        },
        {
           "id":4,
           "room":"Room 2",
           "address":"Birmingham Civil Justice Centre"
        }
     ]`);


  static Judges: ParticipantDetailsResponse[] = JSON.parse(
    `[
        {
          "id": "1",
          "first_name": "John",
          "last_name": "Doe",
          "middle_names": "a",
          "display_name": "John Doe",
          "email": "John.Doe@hearings.reform.hmcts.net",
          "title": "Judge",
          "role": "Judge"
        },
        {
           "id":"2",
           "first_name": "John2",
           "last_name": "Doe",
           "middle_names": "",
           "display_name": "John2 Doe",
           "email": "John2.Doe@hearings.reform.hmcts.net",
           "title": "Judge",
           "role": "Judge"
        },
        {
           "id":"3",
           "first_name": "John3",
           "last_name": "Doe",
           "middle_names": "",
           "display_name": "John3 Doe",
           "email": "John3.Doe@hearings.reform.hmcts.net",
           "title": "Judge",
           "role": "Judge"
        },
        {
           "id":"4",
           "first_name": "John4",
           "last_name": "Doe",
           "middle_names": "",
           "display_name": "John4 Doe",
           "email": "John4.Doe@hearings.reform.hmcts.net",
           "title": "Judge",
           "role": "Judge"
        }
     ]`);
}
