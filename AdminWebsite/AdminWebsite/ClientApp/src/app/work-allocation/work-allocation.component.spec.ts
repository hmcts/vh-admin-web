import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkAllocationComponent } from './work-allocation.component';

describe('WorkAllocationComponent', () => {
  let component: WorkAllocationComponent;
  let fixture: ComponentFixture<WorkAllocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkAllocationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkAllocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
