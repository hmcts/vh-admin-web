import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelBookingPopupComponent } from './cancel-booking-popup.component';

describe('CancelBookingPopupComponent', () => {
  let component: CancelBookingPopupComponent;
  let fixture: ComponentFixture<CancelBookingPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CancelBookingPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelBookingPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
