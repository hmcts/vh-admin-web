import { HearingsForAudioFileSearchResponse } from '../../services/clients/api-client';

export class HearingAudioSearchModel {
    constructor(apiResponse: HearingsForAudioFileSearchResponse) {
        this.hearingId = apiResponse.id;
        this.caseName = apiResponse.case_name;
        this.caseNumber = apiResponse.case_number;
        this.scheduledDateTime = apiResponse.scheduled_date_time;
        this.hearingVenueName = apiResponse.hearing_venue_name;
        this.hearingRoomName = apiResponse.hearing_room_name;
    }

    hearingId: string;
    caseNumber: string;
    caseName: string;
    scheduledDateTime: Date;
    hearingVenueName: string;
    hearingRoomName: string;
}
