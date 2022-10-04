import { DayWorkingHours } from './day-working-hours';

export class WorkAvailability {
    username: string;
    working_hours: DayWorkingHours[];

    constructor(init?: Partial<DayWorkingHours>) {
        Object.assign(this, init);
    }
}
