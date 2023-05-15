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
    it('should filter answers for individual to suppress questions without answers', () => {
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
                        },
                        {
                            answer: 'Not answered',
                            notes: '',
                            question: 'ROOM',
                            embeddedQuestionAnswers: new Array<EmbeddedSuitabilityQuestionAnswer>()
                        },
                        {
                            answer: 'N/A',
                            notes: '',
                            question: 'KIT_SELFTEST_SCORE',
                            embeddedQuestionAnswers: new Array<EmbeddedSuitabilityQuestionAnswer>()
                        }
                    ]
                })
            ],
            representee: '',
            hearingRole: 'Applicant LIP',
            caseNumber: '',
            displayName: '',
            participantId: '',
            updatedAt: new Date()
        });

        expect(component.isRepresentative).toBeFalsy();

        const answers = component.answers;
        expect(answers.length).toBe(1);
        expect(answers[0].answers.length).toBe(1);
        expect(answers[0].answers[0].answer).toBe('true');
    });
    it('should filter answers for representative to suppress questions without answers', () => {
        component.questionnaire = new ParticipantQuestionnaire({
            answers: [
                new SuitabilityAnswerGroup({
                    title: 'Equipment',
                    answers: [
                        {
                            answer: 'Good',
                            notes: '',
                            question: 'KIT_SELFTEST_SCORE',
                            embeddedQuestionAnswers: new Array<EmbeddedSuitabilityQuestionAnswer>()
                        },
                        {
                            answer: 'I will be presenting the case',
                            notes: '',
                            question: 'PRESENTING_THE_CASE',
                            embeddedQuestionAnswers: new Array<EmbeddedSuitabilityQuestionAnswer>()
                        },
                        {
                            answer: '',
                            notes: '',
                            question: 'OTHER_INFORMATION',
                            embeddedQuestionAnswers: new Array<EmbeddedSuitabilityQuestionAnswer>()
                        }
                    ]
                })
            ],
            representee: 'Citizen',
            hearingRole: 'Representative',
            caseNumber: '',
            displayName: '',
            participantId: '',
            updatedAt: new Date()
        });

        expect(component.isRepresentative).toBeTruthy();

        const answers = component.answers;
        expect(answers.length).toBe(1);
        expect(answers[0].answers.length).toBe(1);
        expect(answers[0].answers[0].answer).toBe('Good');
    });
});
