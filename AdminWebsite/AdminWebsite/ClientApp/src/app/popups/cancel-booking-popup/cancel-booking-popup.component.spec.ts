import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelBookingPopupComponent } from './cancel-booking-popup.component';
import { DebugElement, ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('CancelBookingPopupComponent', () => {
  let component: CancelBookingPopupComponent;
  let fixture: ComponentFixture<CancelBookingPopupComponent>;
  let de: DebugElement;
  let buttonCancel: ElementRef;
  let buttonKeep: ElementRef;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CancelBookingPopupComponent
      ]
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
  });

  it('should emit event when the cancel button is clicked', () => {
    spyOn(component.cancelBooking, 'emit');
    buttonCancel.nativeElement.click();
    expect(component.cancelBooking.emit).toHaveBeenCalled();
  });
  it('should emit event when the keep button is clicked', () => {
    spyOn(component.keepBooking, 'emit');
    buttonKeep.nativeElement.click();
    expect(component.keepBooking.emit).toHaveBeenCalled();
  });
});
