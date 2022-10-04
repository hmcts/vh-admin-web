export class DayWorkingHours {
    day_of_week_id: number;
    end_time_hour: number | null;
    end_time_minutes: number | null;
    start_time_hour: number | null;
    start_time_minutes: number | null;

    constructor(
        dayOfWeekId: number,
        startTimeHour: number | null = null,
        startTimeMinutes: number | null = null,
        endTimeHour: number | null = null,
        endTimeMinutes: number | null = null
    ) {
        this.day_of_week_id = dayOfWeekId;
        this.end_time_hour = endTimeHour;
        this.end_time_minutes = endTimeMinutes;
        this.start_time_hour = startTimeHour;
        this.start_time_minutes = startTimeMinutes;
    }
}
