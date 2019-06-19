import { ParticipantQuestionnaire, SuitabilityAnswerGroup, SuitabilityAnswer } from './../participant-questionnaire';
import { ParticipantSuitabilityAnswerResponse, SuitabilityAnswerResponse } from './../../services/clients/api-client';
import { BHClient } from 'src/app/services/clients/api-client';
import { Injectable } from '@angular/core';
import { ScrollableSuitabilityAnswersService, SuitabilityAnswersPage } from './scrollable-suitability-answers.service';

@Injectable()
export class QuestionnaireApiService implements ScrollableSuitabilityAnswersService {
    constructor(private client: BHClient) {}

    async getSuitabilityAnswers(cursor: string, limit: number): Promise<SuitabilityAnswersPage> {
        const response = await this.client.getSuitabilityAnswers(cursor, limit).toPromise();
        const page = new SuitabilityAnswersPage();
        page.nextCursor = response.next_cursor;
        page.questionnaires = response.participant_suitability_answer_response.map(item => this.map(item));
        return page;
    }

    private map(response: ParticipantSuitabilityAnswerResponse): ParticipantQuestionnaire {
        return new ParticipantQuestionnaire({
            displayName: `${response.first_name} ${response.last_name}`,
            caseNumber: response.case_number,
            hearingRole: response.hearing_role,
            representee: response.representee,
            hearingId: 'missing',
            participantId: response.participant_id,
            updatedAt: response.updated_at,
            answers: this.mapAnswerGroups(response.answers)
        });
    }

    private mapAnswerGroups(answers: SuitabilityAnswerResponse[]): SuitabilityAnswerGroup[] {
        return [
            new SuitabilityAnswerGroup({
                title: 'all answers',
                answers: answers.map(answer => this.mapAnswer(answer))
            })
        ];
    }

    private mapAnswer(answer: SuitabilityAnswerResponse): SuitabilityAnswer {
        return new SuitabilityAnswer({
            question: `Question text for ${answer.key}`,
            answer: answer.answer,
            notes: answer.extended_answer
        });
    }
}
