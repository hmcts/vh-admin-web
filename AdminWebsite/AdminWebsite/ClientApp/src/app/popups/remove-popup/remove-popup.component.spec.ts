import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RemovePopupComponent } from './remove-popup.component';

describe('RemovePopupComponent', () => {
  let component: RemovePopupComponent;
  let fixture: ComponentFixture<RemovePopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RemovePopupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemovePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create remove popup component', () => {
    expect(component).toBeTruthy();
  });
});
