import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialMeasuresFormComponent } from './special-measures-form.component';

describe('SpecialMeasuresFormComponent', () => {
  let component: SpecialMeasuresFormComponent;
  let fixture: ComponentFixture<SpecialMeasuresFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpecialMeasuresFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SpecialMeasuresFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
