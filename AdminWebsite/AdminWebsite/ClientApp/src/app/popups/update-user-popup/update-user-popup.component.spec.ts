import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateUserPopupComponent } from './update-user-popup.component';
import { DebugElement, ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('UpdateUserSuccessPopupComponent', () => {
  let component: UpdateUserPopupComponent;
  let fixture: ComponentFixture<UpdateUserPopupComponent>;
  let de: DebugElement;
  let buttonOkay: ElementRef;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateUserPopupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateUserPopupComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    buttonOkay = de.query(By.css('#btnOkay'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should emit event when the okay button is clicked', () => {
    spyOn(component.okay, 'emit');
    buttonOkay.nativeElement.click();
    expect(component.okay.emit).toHaveBeenCalled();
  });
});
