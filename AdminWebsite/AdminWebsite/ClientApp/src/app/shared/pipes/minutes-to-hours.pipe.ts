import { Pipe, PipeTransform } from '@angular/core';
import { DateAndTimeService } from '../../services/date-and-time.service';

@Pipe({
    name: 'minutesToHours'
})
export class MinutesToHoursPipe implements PipeTransform {
    constructor(private readonly dateTimeService: DateAndTimeService) {}
    transform(totalMinutes: number): string {
        const time = this.dateTimeService.minutesToHours(totalMinutes);
        const hours = `${time.hours}${time.hours > 1 ? 'hrs' : 'hr'}`;
        const minutes = time.minutes !== 0 ? ` ${time.minutes}min` : '';
        return hours + minutes;
    }
}
