import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiDayHearingScheduleComponent } from './multi-day-hearing-schedule.component';

describe('MultiDayHearingScheduleComponent with valid request', () => {
    let component: MultiDayHearingScheduleComponent;
    let fixture: ComponentFixture<MultiDayHearingScheduleComponent>;

    beforeEach(() => {
        fixture = TestBed.createComponent(MultiDayHearingScheduleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should call groupHearingDates on init', () => {
        spyOn(component, 'groupHearingDates');
        component.ngOnInit();
        expect(component.groupHearingDates).toHaveBeenCalled();
    });

    it('should group hearing dates', () => {
        component.hearingDates = [
            '2021-01-01',
            '2021-01-02',
            '2021-01-03',
            '2021-02-01',
            '2021-02-02',
            '2021-02-03',
            '2021-02-04',
            '2022-02-02',
            '2022-02-03',
            '2022-02-04'
        ];
        component.ngOnInit();
        expect(component.groupedHearingDates.length).toBe(3);
        expect(component.groupedHearingDates[0].label).toBe('January 2021');
        expect(component.groupedHearingDates[1].label).toBe('February 2021');
        expect(component.groupedHearingDates[2].label).toBe('February 2022');

        expect(component.groupedHearingDates[0].hearingDates.length).toBe(3);
        expect(component.groupedHearingDates[1].hearingDates.length).toBe(4);
        expect(component.groupedHearingDates[2].hearingDates.length).toBe(3);
    });

    it('should map hearing date strings to dates', () => {
        component.hearingDates = [
            '2021-01-01',
            '2021-01-02',
            '2021-01-03',
            '2021-02-01',
            '2021-02-02',
            '2021-02-03',
            '2021-02-04',
            '2022-02-02',
            '2022-02-03',
            '2022-02-04'
        ];
        expect(component.hearingDatesAsDates(component.hearingDates).every(x => typeof x.getMonth === 'function')).toBe(true);
    });

    it('should return a string label with month and year for a given date', () => {
        expect(component.labelFromDate(new Date('2021-09-09'))).toBe('September 2021');
    });
});
