import { HearingsByUsernameForDeletionResponse } from '../../services/clients/api-client';

export class ParticipantHearingDeleteResultModel {
    hearingId: string;
    caseNumber: string;
    caseName: string;
    scheduledDateTime: Date;
    hearingVenueName: string;
    hearingRoomName: string;

    constructor(apiResponse: HearingsByUsernameForDeletionResponse) {
        this.hearingId = apiResponse.hearing_id;
        this.caseName = apiResponse.case_name;
        this.caseNumber = apiResponse.case_number;
        this.scheduledDateTime = apiResponse.scheduled_date_time;
        this.hearingVenueName = apiResponse.venue;
    }
}
