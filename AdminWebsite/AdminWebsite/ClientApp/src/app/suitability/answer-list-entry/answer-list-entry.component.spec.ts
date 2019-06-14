import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerListEntryComponent } from './answer-list-entry.component';

describe('AnswerListEntryComponent', () => {
  let component: AnswerListEntryComponent;
  let fixture: ComponentFixture<AnswerListEntryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnswerListEntryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerListEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
