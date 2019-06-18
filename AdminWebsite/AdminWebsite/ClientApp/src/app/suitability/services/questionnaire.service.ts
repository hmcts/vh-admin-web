import { Injectable } from '@angular/core';
import { ParticipantQuestionnaire } from '../participant-questionnaire';

export class SuitabilityAnswersPage {
    questionnaires: ParticipantQuestionnaire[];
    nextPage: string;
}

export interface PagedSuitabilityAnswersService {
    getSuitabilityAnswers(cursor: string, limit: number): Promise<SuitabilityAnswersPage>;
}

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
    private nextPage: string = null;

    constructor(private service: PagedSuitabilityAnswersService) {}

    async loadNext(): Promise<QuestionnaireResponses> {
        const page = await this.service.getSuitabilityAnswers(this.nextPage, 100);
        this.nextPage = page.nextPage;
        return new QuestionnaireResponses(
            page.questionnaires,
            this.nextPage !== null
        );
    }
}
