export class DayWorkingHours {
  dayOfWeekId: number;
  endTimeHour: number;
  endTimeMinutes: number;
  startTimeHour: number;
  startTimeMinutes: number;

  constructor(init?: Partial<DayWorkingHours>) {
    Object.assign(this, init);
  }
}