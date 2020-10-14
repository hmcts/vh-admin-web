import { DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConfirmBookingFailedPopupComponent } from './confirm-booking-failed-popup.component';

describe('SaveFailedPopupComponent', () => {
    let component: ConfirmBookingFailedPopupComponent;
    let fixture: ComponentFixture<ConfirmBookingFailedPopupComponent>;
    let de: DebugElement;
    let buttonTryAgain: ElementRef;
    let buttonCancel: ElementRef;

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
        buttonCancel = de.query(By.css('#btnCancel'));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit event when the ok button is clicked', () => {
        spyOn(component.close, 'emit');
        buttonTryAgain.nativeElement.click();
        expect(component.close.emit).toHaveBeenCalled();
    });
});
