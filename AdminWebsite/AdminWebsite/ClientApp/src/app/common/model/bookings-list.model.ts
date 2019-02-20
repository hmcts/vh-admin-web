import { st } from "@angular/core/src/render3";

export class BookingsListModel {

    constructor(bookingsDate: Date) {
        this.BookingsDate = bookingsDate;
        this.BookingsDetails = [];
    }

    BookingsDate: Date;
    BookingsDetails: Array<BookingsDetailsModel>;

}

export class BookingsDetailsModel {

    constructor(hearingId:number, startTime: Date, duration: number, hearingCaseNumber: string,
        hearingCaseName: string, hearingType: string, judgeName: string, courtRoom:string,
        courtAddress: string, createdBy: string, createdDate: Date, lastEditBy: string,
        lastEditDate: Date
    ) {
        this.HearingId = hearingId;
        this.StartTime = startTime;
        this.Duration = duration;
        this.HearingCaseName = hearingCaseName;
        this.HearingCaseNumber = hearingCaseNumber;
        this.HearingType = hearingType;
        this.JudgeName = judgeName;
        this.CourtRoom = courtRoom
        this.CourtAddress = courtAddress;
        this.CreatedBy = createdBy;
        this.CreatedDate = createdDate;
        this.LastEditBy = lastEditBy;
        this.LastEditDate = lastEditDate;
    }

    HearingId:number;
    StartTime: Date;
    Duration: number;
    HearingCaseNumber: string;
    HearingCaseName: string;
    HearingType: string;
    JudgeName: string;
    CourtRoom:string;
    CourtAddress: string;
    CreatedBy: string;
    CreatedDate: Date;
    LastEditBy: string;
    LastEditDate: Date;
}