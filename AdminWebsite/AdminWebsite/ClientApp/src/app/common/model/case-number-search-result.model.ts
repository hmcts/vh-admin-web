export class CaseNumberSearchResultModel {
    constructor(apiResponse: any) {
        this.caseName = apiResponse.caseName;
        this.caseNumber = apiResponse.caseNumber;
        this.scheduledDateTime = apiResponse.scheduledDateTime;
    }

    caseNumber: string;
    caseName: string;
    scheduledDateTime: string;
}
