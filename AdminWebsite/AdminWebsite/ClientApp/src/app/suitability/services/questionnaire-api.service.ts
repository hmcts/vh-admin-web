import { ParticipantQuestionnaire } from './../participant-questionnaire';
import { ParticipantSuitabilityAnswerResponse } from './../../services/clients/api-client';
import { BHClient } from 'src/app/services/clients/api-client';
import { PagedSuitabilityAnswersService, SuitabilityAnswersPage } from './questionnaire.service';

export class QuestionnaireApiService implements PagedSuitabilityAnswersService {
    constructor(private client: BHClient) {}

    async getSuitabilityAnswers(cursor: string, limit: number): Promise<SuitabilityAnswersPage> {
        const response = await this.client.getSuitabilityAnswers(cursor, limit).toPromise();
        const page = new SuitabilityAnswersPage();
        page.nextCursor = response.next_cursor;
        page.questionnaires = response.participant_suitability_answer_response.map(item => this.map(item));
        return page;
    }

    private map(response: ParticipantSuitabilityAnswerResponse): ParticipantQuestionnaire {
        return null;
    }
}
