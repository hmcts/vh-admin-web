import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VenuesMenuComponent } from './venues-menu.component';

describe('VenuesMenuComponent', () => {
  let component: VenuesMenuComponent;
  let fixture: ComponentFixture<VenuesMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VenuesMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VenuesMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
