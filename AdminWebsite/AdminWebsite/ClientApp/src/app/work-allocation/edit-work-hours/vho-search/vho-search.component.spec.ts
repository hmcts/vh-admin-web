import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VhoSearchComponent } from './vho-search.component';

describe('VhoSearchComponent', () => {
  let component: VhoSearchComponent;
  let fixture: ComponentFixture<VhoSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VhoSearchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VhoSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
