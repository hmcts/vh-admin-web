export class NonWorkingHours {
    end_date_time: Date;
    start_date_time: Date;

    constructor(startDateTime: Date, endDateTime: Date) {
        this.end_date_time = endDateTime;
        this.start_date_time = startDateTime;
    }
}
