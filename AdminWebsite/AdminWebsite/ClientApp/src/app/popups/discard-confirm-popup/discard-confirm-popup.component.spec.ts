import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DiscardConfirmPopupComponent } from './discard-confirm-popup.component';

describe('DiscardConfirmPopupComponent', () => {
  let component: DiscardConfirmPopupComponent;
  let fixture: ComponentFixture<DiscardConfirmPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DiscardConfirmPopupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscardConfirmPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create cancel pop up component', () => {
    expect(component).toBeTruthy();
  });
});
