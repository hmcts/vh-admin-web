import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WaitPopupComponent } from './wait-popup.component';
import { By } from '@angular/platform-browser';
import { DebugElement, ElementRef } from '@angular/core';

describe('WaitPopupComponent', () => {
    let component: WaitPopupComponent;
    let fixture: ComponentFixture<WaitPopupComponent>;
    let de: DebugElement;
    let headingText: ElementRef;
    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [WaitPopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitPopupComponent);
        component = fixture.componentInstance;
        de = fixture.debugElement;
        headingText = de.query(By.css('.govuk-heading-m'));
        fixture.detectChanges();
    });

    it('should create wait pop up component', () => {
        expect(component).toBeTruthy();
    });

    it('should have heading Confirming bookings can take up to 60 seconds to complete.', () => {
        component.ConfirmationMode = true;
        fixture.detectChanges();
        headingText = de.query(By.css('.govuk-heading-m'));
        expect(headingText.nativeElement.innerText).toEqual('Confirming bookings can take up to 60 seconds to complete.');
    });
    it('should have heading Booking a hearing can take up to 60 seconds to complete.', () => {
        component.ConfirmationMode = false;
        fixture.detectChanges();
        headingText = de.query(By.css('.govuk-heading-m'));
        expect(headingText.nativeElement.innerText).toEqual('Booking a hearing can take up to 60 seconds to complete.');
    });
});
