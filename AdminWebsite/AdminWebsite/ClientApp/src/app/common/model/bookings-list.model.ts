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
    lastEditDate: Date, status: string
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
    this.Selected = false;
    this.Status = status;
    this.Cancelled = this.Status === 'Cancelled';
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
  Selected: boolean;
  Cancelled: boolean;
  OtherInformation: string;
  Status: string;

  get DurationInHoursAndMinutes(): string {
    const hours = Math.floor(this.Duration / 60);
    const min = this.Duration % 60;
    const wordHours = hours > 1 ? 'hours' : 'hour';
    const strHours = hours > 0 ? `${hours} ${wordHours}` : '';
    const wordMin = min > 0 ? `${min} minutes` : '';
    return `${strHours} ${wordMin}`.trim();
  }

  public get isCancelled(): boolean {
    return this.Status === 'Cancelled';
  }
}
