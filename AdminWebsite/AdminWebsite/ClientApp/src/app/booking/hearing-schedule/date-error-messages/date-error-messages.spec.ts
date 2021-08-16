import { DateErrorMessagesComponent } from './date-error-messages';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DebugElement, ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('Date error message test suite', () => {
    let component: DateErrorMessagesComponent;
    let fixture: ComponentFixture<DateErrorMessagesComponent>;
    let debugElement: DebugElement;

    const pastErrorId = '#hearingDate-past-error';
    const weekendErrorId = '#hearingDate-weekend-error';
    const requiredErrorId = '#hearingDate-required-error';

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [DateErrorMessagesComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(DateErrorMessagesComponent);
        component = fixture.componentInstance;

        debugElement = fixture.debugElement;
    });

    it('should show Select a date error message when no date is selected', () => {
        component.required = true;
        fixture.detectChanges();
        expect(debugElement.query(By.css(requiredErrorId))).toBeTruthy();
    });

    it('should show Please enter a working day (Monday to Friday) error message when weekend date is selected', () => {
        component.weekend = true;
        fixture.detectChanges();
        expect(debugElement.query(By.css(weekendErrorId))).toBeTruthy();
    });

    it('should show Please enter a working day (Monday to Friday) error message when public holiday date is selected', () => {
        component.publicHoliday = true;
        fixture.detectChanges();
        expect(debugElement.query(By.css(weekendErrorId))).toBeTruthy();
    });

    it('should show Select a date in the future error message when past date is selected', () => {
        component.pastDate = true;
        fixture.detectChanges();
        expect(debugElement.query(By.css(pastErrorId))).toBeTruthy();
    });

    it('should not show any error messages when all the properties are false', () => {
        component.required = component.pastDate = component.weekend = component.publicHoliday = false;
        expect(debugElement.query(By.css(requiredErrorId))).toBeFalsy();
        expect(debugElement.query(By.css(weekendErrorId))).toBeFalsy();
        expect(debugElement.query(By.css(pastErrorId))).toBeFalsy();
    });

    it('should show both past and weekend messages when the selected date was in weekend of past', () => {
        component.required = component.publicHoliday = false;
        component.pastDate = component.weekend = true;
        fixture.detectChanges();
        expect(debugElement.query(By.css(weekendErrorId))).toBeTruthy();
        expect(debugElement.query(By.css(pastErrorId))).toBeTruthy();
    });
});
