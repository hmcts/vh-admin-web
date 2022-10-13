import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWorkHoursComponent } from './edit-work-hours.component';

describe('EditWorkHoursComponent', () => {
  let component: EditWorkHoursComponent;
  let fixture: ComponentFixture<EditWorkHoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditWorkHoursComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditWorkHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
