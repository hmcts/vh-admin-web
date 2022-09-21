import { DayWorkingHours } from './day-working-hours';

export class WorkAvailability {
  username: string;
  workingHours: DayWorkingHours[];

  constructor(init?: Partial<DayWorkingHours>) {
    Object.assign(this, init);
  }
}