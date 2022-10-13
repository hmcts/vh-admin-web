import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VhoWorkHoursTableComponent } from './vho-work-hours-table.component';

describe('VhoWorkHoursTableComponent', () => {
  let component: VhoWorkHoursTableComponent;
  let fixture: ComponentFixture<VhoWorkHoursTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VhoWorkHoursTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VhoWorkHoursTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
