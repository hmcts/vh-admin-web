import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SignOutPopupComponent } from './sign-out-popup.component';

describe('CancelPopupComponent', () => {
  let component: SignOutPopupComponent;
  let fixture: ComponentFixture<SignOutPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SignOutPopupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignOutPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create sign out popup component', () => {
    expect(component).toBeTruthy();
  });
});
