import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { EmbeddedSuitabilityQuestionAnswer, ParticipantQuestionnaire, SuitabilityAnswerGroup } from './../participant-questionnaire';
import { AnswerListEntryComponent } from './answer-list-entry.component';

describe('AnswerListEntryComponent', () => {
    let component: AnswerListEntryComponent;
    let fixture: ComponentFixture<AnswerListEntryComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [AnswerListEntryComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AnswerListEntryComponent);
        component = fixture.componentInstance;
        component.questionnaire = new ParticipantQuestionnaire({
            answers: [
                new SuitabilityAnswerGroup({
                    title: 'Equipment',
                    answers: [
                        {
                            answer: 'true',
                            notes: 'I have an eyesight problem',
                            question: 'ABOUT_YOU',
                            embeddedQuestionAnswers: new Array<EmbeddedSuitabilityQuestionAnswer>()
                        }
                    ]
                })
            ],
            representee: 'presenting Ms X',
            hearingRole: 'Representative',
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
