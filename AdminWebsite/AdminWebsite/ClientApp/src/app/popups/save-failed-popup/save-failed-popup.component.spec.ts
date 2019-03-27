import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveFailedPopupComponent } from './save-failed-popup.component';

describe('SaveFailedPopupComponent', () => {
  let component: SaveFailedPopupComponent;
  let fixture: ComponentFixture<SaveFailedPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaveFailedPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveFailedPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
