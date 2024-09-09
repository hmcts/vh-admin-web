import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialMeasuresComponent } from './special-measures.component';

describe('SpecialMeasuresComponent', () => {
  let component: SpecialMeasuresComponent;
  let fixture: ComponentFixture<SpecialMeasuresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpecialMeasuresComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SpecialMeasuresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
