import { FormatShortDuration } from '../formatters/format-short-duration';
import { EndpointModel } from './endpoint.model';

export class BookingsListModel {
    constructor(bookingsDate: Date) {
        this.BookingsDate = bookingsDate;
        this.BookingsDetails = [];
    }

    BookingsDate: Date;
    BookingsDetails: Array<BookingsDetailsModel>;
}

export class BookingsDetailsModel {

    constructor(hearingId: string, startTime: Date, duration: number, hearingCaseNumber: string,
        hearingCaseName: string, hearingType: string, judgeName: string, courtRoom: string,
        courtAddress: string, createdBy: string, createdDate: Date, lastEditBy: string,
        lastEditDate: Date, confirmedBy: string, confirmedDate: Date,
        status: string, questionnaireNotRequired: boolean, audioRecordingRequired: boolean,
        cancelReason: string, caseType: string
    ) {
        this.HearingId = hearingId;
        this.StartTime = startTime;
        this.Duration = duration;
        this.HearingCaseName = hearingCaseName;
        this.HearingCaseNumber = hearingCaseNumber;
        this.HearingType = hearingType;
        this.JudgeName = judgeName;
        this.CourtRoom = courtRoom;
        this.CourtAddress = courtAddress;
        this.CreatedBy = createdBy;
        this.CreatedDate = createdDate;
        this.LastEditBy = lastEditBy;
        this.LastEditDate = lastEditDate;
        this.ConfirmedBy = confirmedBy;
        this.ConfirmedDate = confirmedDate;
        this.Selected = false;
        this.Status = status;
        this.Cancelled = this.Status === 'Cancelled';
        this.QuestionnaireNotRequired = questionnaireNotRequired;
        this.AudioRecordingRequired = audioRecordingRequired;
        this.CancelReason = cancelReason;
        this.CaseType = caseType;
    }

    HearingId: string;
    StartTime: Date;
    Duration: number;
    HearingCaseNumber: string;
    HearingCaseName: string;
    HearingType: string;
    JudgeName: string;
    CourtRoom: string;
    CourtAddress: string;
    CreatedBy: string;
    CreatedDate: Date;
    LastEditBy: string;
    LastEditDate: Date;
    ConfirmedBy: string;
    ConfirmedDate: Date;
    Selected: boolean;
    Cancelled: boolean;
    OtherInformation: string;
    Status: string;
    QuestionnaireNotRequired: boolean;
    IsStartTimeChanged: boolean;
    AudioRecordingRequired: boolean;
    CancelReason: string;
    CaseType: string;
    Endpoints: EndpointModel[];

    get DurationInHoursAndMinutes(): string {
        return FormatShortDuration(this.Duration);
    }

    public get isCancelled(): boolean {
        return this.Status === 'Cancelled';
    }

    public get isCreated(): boolean {
        return this.Status === 'Created';
    }

    public get hasBookingConfirmationFailed(): boolean {
        return this.Status === 'Failed';
    }
}
