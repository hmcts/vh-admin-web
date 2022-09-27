export class DayWorkingHours {
    dayOfWeekId: number;
    endTimeHour: number | null;
    endTimeMinutes: number | null;
    startTimeHour: number | null;
    startTimeMinutes: number | null;

    constructor(
        dayOfWeekId: number,
        endTimeHour: number | null = null,
        endTimeMinutes: number | null = null,
        startTimeHour: number | null = null,
        startTimeMinutes: number | null = null
    ) {
        this.dayOfWeekId = dayOfWeekId;
        this.endTimeHour = endTimeHour;
        this.endTimeMinutes = endTimeMinutes;
        this.startTimeHour = startTimeHour;
        this.startTimeMinutes = startTimeMinutes;
    }
}
