import { DateErrorMessagesComponent } from './date-error-messages';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DebugElement, ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('Date error message test suite', () => {
    let component: DateErrorMessagesComponent;
    let fixture: ComponentFixture<DateErrorMessagesComponent>;
    let debugElement: DebugElement;
    let requiredMessage: ElementRef;
    let pastMessage: ElementRef;
    let weekendHolidayMessage: ElementRef;

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
        requiredMessage = debugElement.query(By.css('#hearingDate-required-error'));
        expect(requiredMessage.nativeElement.innerText).toEqual('Select a date');
    });

    it('should show Please enter a working day (Monday to Friday) error message when weekend date is selected', () => {
        component.weekend = true;
        fixture.detectChanges();
        weekendHolidayMessage = debugElement.query(By.css('#hearingDate-weekend-error'));
        expect(weekendHolidayMessage.nativeElement.innerText).toEqual('Please enter a working day (Monday to Friday)');
    });

    it('should show Please enter a working day (Monday to Friday) error message when public holiday date is selected', () => {
        component.publicHoliday = true;
        fixture.detectChanges();
        weekendHolidayMessage = debugElement.query(By.css('#hearingDate-weekend-error'));
        expect(weekendHolidayMessage.nativeElement.innerText).toEqual('Please enter a working day (Monday to Friday)');
    });

    it('should show Select a date in the future error message when past date is selected', () => {
        component.pastDate = true;
        fixture.detectChanges();
        pastMessage = debugElement.query(By.css('#hearingDate-past-error'));
        expect(pastMessage.nativeElement.innerText).toEqual('Select a date in the future');
    });
});
