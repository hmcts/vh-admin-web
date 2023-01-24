import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DateAndTimeService {
    minutesToHours(totalMinutes: number): { hours: number; minutes: number } {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return { hours, minutes };
    }

    minutesToHoursDisplay(totalMinutes: number): string {
        const time = this.minutesToHours(totalMinutes);
        const hours = `${time.hours}${time.hours > 1 ? 'hrs' : 'hr'}`;
        const minutes = time.minutes !== 0 ? ` ${time.minutes}min` : '';
        return hours + minutes;
    }
}
