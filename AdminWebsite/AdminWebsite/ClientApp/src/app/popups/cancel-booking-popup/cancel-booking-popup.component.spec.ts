import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CancelBookingPopupComponent } from './cancel-booking-popup.component';
import { DebugElement, ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AbstractControl } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('CancelBookingPopupComponent', () => {
  let component: CancelBookingPopupComponent;
  let fixture: ComponentFixture<CancelBookingPopupComponent>;
  let de: DebugElement;
  let buttonCancel: ElementRef;
  let buttonKeep: ElementRef;
  let cancelReasonControl: AbstractControl;
  let cancelReasonDetailsControl: AbstractControl;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule
      ],
      declarations: [
        CancelBookingPopupComponent
      ],
    })
      .compileComponents();
  }));

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
});
