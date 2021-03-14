import { Component, Input } from '@angular/core';
interface HearingDateGroup {
    label: string;
    hearingDates: Date[];
}

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];
@Component({
    selector: 'app-multi-day-hearing-schedule',
    templateUrl: './multi-day-hearing-schedule.component.html',
    styleUrls: ['./multi-day-hearing-schedule.component.scss']
})
export class MultiDayHearingScheduleComponent {
    @Input() hearingDates = [];
    groupedHearingDates: HearingDateGroup[] = [];

    ngOnInit() {
        this.groupHearingDates();
    }

    groupHearingDates() {
        const hearingDates = this.hearingDatesAsDates(this.hearingDates);
        this.groupedHearingDates = hearingDates.reduce((a, c) => {
            const label = this.labelFromDate(c);
            if (!a.some(x => x.label === label)) {
                const dates = this.hearingDatesForGroup(c, hearingDates);
                a.push({ label, hearingDates: dates });
            }
            return a;
        }, this.groupedHearingDates);
    }

    hearingDatesAsDates(hearingDates: string[]) {
        return hearingDates.filter(x => x).map(x => new Date(x));
    }

    labelFromDate(date: Date): string {
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const monthName = months[monthIndex];
        return `${monthName} ${year}`;
    }

    hearingDatesForGroup(date: Date, hearingDates: Date[]) {
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        return hearingDates.filter(date => date.getMonth() === monthIndex && date.getFullYear() === year);
    }
}