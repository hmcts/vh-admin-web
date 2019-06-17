import { Injectable } from '@angular/core';
import { ParticipantQuestionnaire, SuitabilityAnswerGroup } from '../participant-questionnaire';

export class QuestionnaireResponses {
    readonly items: ParticipantQuestionnaire[];
    readonly hasMore: boolean;

    constructor(items: ParticipantQuestionnaire[], hasMore: boolean) {
        this.items = items;
        this.hasMore = hasMore;
    }
}

@Injectable()
export class QuestionnaireService {
    private counter = 0;

    loadNext(): Promise<QuestionnaireResponses> {
        this.counter += 1;
        if (this.counter > 2) {
            return Promise.resolve(new QuestionnaireResponses([], false));
        } else if (this.counter === 2) {
            return Promise.resolve(new QuestionnaireResponses(
                [
                    new ParticipantQuestionnaire({
                        participantId: 'participantId',
                        hearingId: 'hearingId',
                        displayName: 'James Johnson',
                        caseNumber: 'Y231231',
                        caseName: 'Johnson Co vs HMRC',
                        answers: [
                            new SuitabilityAnswerGroup({
                                title: 'Equipment',
                                answers: [
                                    {
                                        answer: 'true',
                                        notes: 'I have an eyesight problem',
                                        question: 'ABOUT_YOU'
                                    }
                                ]
                            })
                        ]
                    })
                ],
                false
            ));
        }

        return Promise.resolve(new QuestionnaireResponses(
            [
                new ParticipantQuestionnaire({
                    participantId: 'participantId',
                    hearingId: 'hearingId',
                    displayName: 'Bob Jones',
                    caseNumber: 'X32123211',
                    caseName: 'Bob vs The State',
                    answers: []
                })
            ],
            true
        ));
    }
}
