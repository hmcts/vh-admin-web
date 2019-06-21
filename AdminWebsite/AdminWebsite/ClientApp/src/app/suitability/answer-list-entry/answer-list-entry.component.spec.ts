import { ParticipantQuestionnaire, SuitabilityAnswerGroup } from './../participant-questionnaire';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerListEntryComponent } from './answer-list-entry.component';

describe('AnswerListEntryComponent', () => {
  let component: AnswerListEntryComponent;
  let fixture: ComponentFixture<AnswerListEntryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnswerListEntryComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerListEntryComponent);
    component = fixture.componentInstance;
    component.questionnaire = new ParticipantQuestionnaire({
      answers: [new SuitabilityAnswerGroup({
        title: 'Equipment',
        answers: [
          {
            answer: 'true',
            notes: 'I have an eyesight problem',
            question: 'ABOUT_YOU'
          }
        ]
      })],
      representee: 'presenting Ms X',
      hearingRole: 'Solicitor',
      caseNumber: '',
      displayName: '',
      participantId: '',
      updatedAt: new Date()
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should get suitability answer groups', () => {
    expect(component.answers).toBeTruthy();
    expect(component.answers.length).toBeGreaterThan(0);
  });
  it('should identify that a participant is representative', () => {
    expect(component.isRepresentative).toBeTruthy();
  });
});
