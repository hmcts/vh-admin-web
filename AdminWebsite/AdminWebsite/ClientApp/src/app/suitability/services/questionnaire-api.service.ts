import { ParticipantQuestionnaire, SuitabilityAnswerGroup } from '../participant-questionnaire';
import { ParticipantSuitabilityAnswerResponse } from '../../services/clients/api-client';
import { BHClient } from 'src/app/services/clients/api-client';
import { Injectable } from '@angular/core';
import { ScrollableSuitabilityAnswersService, SuitabilityAnswersPage } from './scrollable-suitability-answers.service';
import { QuestionnaireMapper } from './questionnaire-mapper';
import { QuestionnaireMapperFactory } from './questionnaire-mapper-factory.service';

@Injectable()
export class QuestionnaireApiService implements ScrollableSuitabilityAnswersService {
    constructor(private client: BHClient, private mapperFactory: QuestionnaireMapperFactory) {}

    async getSuitabilityAnswers(cursor: string, limit: number): Promise<SuitabilityAnswersPage> {
        const response = await this.client.getSuitabilityAnswers(cursor, limit).toPromise();
        const page = new SuitabilityAnswersPage();
        page.nextCursor = response.next_cursor;
        page.questionnaires = response.participant_suitability_answer_response.map(item => this.map(item));
        return page;
    }

    private map(response: ParticipantSuitabilityAnswerResponse): ParticipantQuestionnaire {
        return new ParticipantQuestionnaire({
            displayName: `${response.title || ''} ${response.first_name} ${response.last_name}`.trim(),
            caseNumber: response.case_number,
            hearingRole: response.hearing_role,
            representee: response.representee,
            participantId: response.participant_id,
            updatedAt: response.updated_at,
            answers: this.mapAnswerGroups(this.mapperFactory.getSuitabilityMapper(response), this.mapperFactory.getSelfTestMapper(response))
        });
    }

    private mapAnswerGroups(suitabilityMapper: QuestionnaireMapper, selfTestMapper: QuestionnaireMapper): SuitabilityAnswerGroup[] {
        return [
            new SuitabilityAnswerGroup({
                title: 'About you and your equipment',
                answers: suitabilityMapper.mapAnswers()
            }),
            new SuitabilityAnswerGroup({
                title: 'Equipment check',
                answers: selfTestMapper.mapAnswers()
            })
        ];
    }
}
