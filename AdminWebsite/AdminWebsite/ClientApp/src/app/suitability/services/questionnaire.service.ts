import { Injectable } from '@angular/core';
import { ParticipantQuestionnaire } from '../participant-questionnaire';
import { ScrollableSuitabilityAnswersService } from './scrollable-suitability-answers.service';

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
    private nextCursor = '';

    constructor(private service: ScrollableSuitabilityAnswersService) {}

    async loadNext(): Promise<QuestionnaireResponses> {
        const page = await this.service.getSuitabilityAnswers(this.nextCursor, 100);
        this.nextCursor = page.nextCursor;
        return new QuestionnaireResponses(
            page.questionnaires,
            this.nextCursor !== null
        );
    }
}
