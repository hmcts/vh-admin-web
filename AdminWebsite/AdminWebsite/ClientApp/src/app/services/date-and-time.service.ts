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
}
