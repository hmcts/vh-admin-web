import { CaseTypeResponse, HearingVenueResponse, JudgeResponse } from 'src/app/services/clients/api-client';

export class MockValues {
    static CaseTypesList: CaseTypeResponse[] = JSON.parse(
        `
    [
      {
        "service_id": "BTA",
        "is_audio_recording_allowed": "true",
        "id": 1,
        "name": "Tax"
      },
      {
        "service_id": "ZZY1",
        "is_audio_recording_allowed": "true",
        "id": 2,
        "name": "Generic"
      },
      {
        "service_id": "FDAH",
        "is_audio_recording_allowed": "true",
        "id": 3,
        "name": "Financial Remedy"
      }
    ]
    `
    );

    static CaseTypesSingle: CaseTypeResponse[] = JSON.parse(
        `
    [
      {
        "service_id": "BTA",
        "is_audio_recording_allowed": "true",
        "id": 1,
        "name": "Tax"
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
