export class HearingAudioSearchModel {
    constructor(apiResponse: any) {
        this.caseName = apiResponse.caseName;
        this.caseNumber = apiResponse.caseNumber;
        this.scheduledDateTime = apiResponse.scheduledDateTime;
        this.hearingVenueName = apiResponse.hearingVenueName;
        this.hearingRoomName = apiResponse.hearingRoomName;
    }

    caseNumber: string;
    caseName: string;
    scheduledDateTime: string;
    hearingVenueName: string;
    hearingRoomName: string;
}
