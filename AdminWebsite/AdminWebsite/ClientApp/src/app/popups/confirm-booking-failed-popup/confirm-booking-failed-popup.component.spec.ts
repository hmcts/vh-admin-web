import { DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConfirmBookingFailedPopupComponent } from './confirm-booking-failed-popup.component';

describe('SaveFailedPopupComponent', () => {
    let component: ConfirmBookingFailedPopupComponent;
    let fixture: ComponentFixture<ConfirmBookingFailedPopupComponent>;
    let de: DebugElement;
    let buttonTryAgain: ElementRef;
    let headingText: ElementRef;
    let bodyText: ElementRef;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ConfirmBookingFailedPopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmBookingFailedPopupComponent);
        component = fixture.componentInstance;
        de = fixture.debugElement;
        buttonTryAgain = de.query(By.css('#btnTryAgain'));
        headingText = de.query(By.css('.govuk-heading-m'));
        bodyText = de.query(By.css('#content-text'));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit event when the close button is clicked', () => {
        spyOn(component.close, 'emit');
        buttonTryAgain.nativeElement.click();
        expect(component.close.emit).toHaveBeenCalled();
    });

    it('should have heading Booking confirmation failed!', () => {
        expect(headingText.nativeElement.innerText).toEqual('Booking confirmation failed!');
    });

    it('should have body Your booking cannot be confirmed. Please try again later.', () => {
        expect(bodyText.nativeElement.innerText).toEqual('Your booking cannot be confirmed. Please try again later.');
    });
});
