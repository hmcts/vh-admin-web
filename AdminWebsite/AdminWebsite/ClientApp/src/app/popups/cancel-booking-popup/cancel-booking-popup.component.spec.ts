import { DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from 'src/app/shared/shared.module';
import { CancelBookingPopupComponent } from './cancel-booking-popup.component';

describe('CancelBookingPopupComponent', () => {
    let component: CancelBookingPopupComponent;
    let fixture: ComponentFixture<CancelBookingPopupComponent>;
    let de: DebugElement;
    let buttonCancel: ElementRef;
    let buttonKeep: ElementRef;
    let cancelReasonControl: AbstractControl;
    let cancelReasonDetailsControl: AbstractControl;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [SharedModule, RouterTestingModule],
                declarations: [CancelBookingPopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(CancelBookingPopupComponent);
        component = fixture.componentInstance;
        de = fixture.debugElement;
        buttonCancel = de.query(By.css('#btnCancelBooking'));
        buttonKeep = de.query(By.css('#btnKeepBooking'));
        fixture.detectChanges();

        cancelReasonControl = component.cancelHearingForm.controls['cancelReason'];
        cancelReasonDetailsControl = component.cancelHearingForm.controls['cancelReasonDetails'];
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
        expect(component.cancelReason).toBeTruthy();
        expect(component.cancelReasonDetails).toBeTruthy();
        expect(component.showDetails).toBe(false);
        expect(fixture.debugElement.query(By.css('#cancelReason-detail'))).toBeFalsy();
    });
    it('should validate cancel reason', () => {
        const cancelReasonValue = 'Settled';
        expect(cancelReasonControl.valid).toBeFalsy();
        cancelReasonControl.setValue(cancelReasonValue);
        expect(cancelReasonControl.valid).toBeTruthy();
        expect(component.selectedCancelReason).toBe(cancelReasonValue);
    });
    it('should display details text box when "other" selected', () => {
        expect(fixture.debugElement.query(By.css('#cancelReason-detail'))).toBeFalsy();
        const select: HTMLSelectElement = fixture.debugElement.query(By.css('#cancel-reason')).nativeElement;
        select.value = select.options[9].value;
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#cancelReason-detail'))).toBeTruthy();
    });
    it('should hide details text box when "settled" selected', () => {
        const select: HTMLSelectElement = fixture.debugElement.query(By.css('#cancel-reason')).nativeElement;
        select.value = select.options[9].value;
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#cancelReason-detail'))).toBeTruthy();
        select.value = select.options[3].value;
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#cancelReason-detail'))).toBeFalsy();
    });
    it('should validate cancel reason details', () => {
        const cancelReasonDetailsValue = 'some other reason!';
        const select: HTMLSelectElement = fixture.debugElement.query(By.css('#cancel-reason')).nativeElement;
        select.value = select.options[9].value;
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#cancelReason-detail'))).toBeTruthy();
        expect(cancelReasonDetailsControl.valid).toBeFalsy();
        cancelReasonDetailsControl.setValue(cancelReasonDetailsValue);
        expect(cancelReasonDetailsControl.valid).toBeTruthy();
        expect(component.cancelReasonDetails.value).toBe(cancelReasonDetailsValue);
    });
    it('should emit event with selected reason when the cancel button is clicked', () => {
        spyOn(component.cancelBooking, 'emit');
        const select: HTMLSelectElement = fixture.debugElement.query(By.css('#cancel-reason')).nativeElement;
        select.value = select.options[4].value;
        select.dispatchEvent(new Event('change'));
        buttonCancel.nativeElement.click();
        fixture.detectChanges();
        expect(component.cancelBooking.emit).toHaveBeenCalledWith(select.value);
    });
    it('should emit event with selected reason from detail when "Other" is selected as cancel reason the cancel button is clicked', () => {
        console.log(component);
        spyOn(component.cancelBooking, 'emit');
        const select: HTMLSelectElement = fixture.debugElement.query(By.css('#cancel-reason')).nativeElement;
        select.value = select.options[9].value;
        select.dispatchEvent(new Event('change'));
        const cancelReasonDetailsValue = 'some other reason!';
        cancelReasonDetailsControl.setValue(cancelReasonDetailsValue);
        buttonCancel.nativeElement.click();
        fixture.detectChanges();
        expect(component.cancelBooking.emit).toHaveBeenCalledWith('Other: ' + cancelReasonDetailsValue);
    });
    it('should emit event when the keep button is clicked', () => {
        spyOn(component.keepBooking, 'emit');
        buttonKeep.nativeElement.click();
        expect(component.keepBooking.emit).toHaveBeenCalled();
    });
    it('should unsubscribe all subcription on destroy', () => {
        component.ngOnDestroy();
        expect(component.$subscriptions[0].closed).toBe(true);
    });
    it('should return character length zero when input is blank or undefined', () => {
        const cancelReasonDetailsValue = undefined;
        cancelReasonDetailsControl.setValue(cancelReasonDetailsValue);
        expect(component.currentInputLength).toBe(0);
    });
    it('should return character length when set', () => {
        const cancelReasonDetailsValue = 'some other reason!';
        cancelReasonDetailsControl.setValue(cancelReasonDetailsValue);
        expect(component.currentInputLength).toBe(cancelReasonDetailsValue.length);
    });
    it('should be invalid input when form has been touched AND max length has been exceeded', () => {
        const cancelReasonDetailsValue =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        cancelReasonDetailsControl.setValue(cancelReasonDetailsValue);
        expect(component.cancelReasonDetailsInvalidMaxLength).toBe(false);
    });
});
