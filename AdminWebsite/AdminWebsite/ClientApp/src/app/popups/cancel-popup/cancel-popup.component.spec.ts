import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelPopupComponent } from './cancel-popup.component';

describe('CancelPopupComponent', () => {
  let component: CancelPopupComponent;
  let fixture: ComponentFixture<CancelPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CancelPopupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create cancel popup component', () => {
    expect(component).toBeTruthy();
  });
});
