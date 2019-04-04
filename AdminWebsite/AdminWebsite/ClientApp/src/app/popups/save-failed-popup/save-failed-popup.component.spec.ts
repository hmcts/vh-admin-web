import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveFailedPopupComponent } from './save-failed-popup.component';
import { By } from '@angular/platform-browser';
import { DebugElement, ElementRef } from '@angular/core';

describe('SaveFailedPopupComponent', () => {
  let component: SaveFailedPopupComponent;
  let fixture: ComponentFixture<SaveFailedPopupComponent>;
  let de: DebugElement;
  let buttonTryAgain: ElementRef;
  let buttonCancel: ElementRef;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SaveFailedPopupComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveFailedPopupComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    buttonTryAgain = de.query(By.css('#btnTryAgain'));
    buttonCancel = de.query(By.css('#btnCancel'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should emit event when the try again button is clicked', () => {
    spyOn(component.tryAgain, 'emit');
    buttonTryAgain.nativeElement.click();
    expect(component.tryAgain.emit).toHaveBeenCalled();
  });
  it('should emit event when the cancel button is clicked', () => {
    spyOn(component.cancel, 'emit');
    buttonCancel.nativeElement.click();
    expect(component.cancel.emit).toHaveBeenCalled();
  });
});
