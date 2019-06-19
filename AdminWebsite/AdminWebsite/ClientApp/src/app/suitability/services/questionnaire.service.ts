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
  private hasMore = true;

  constructor(private service: ScrollableSuitabilityAnswersService) { }

  async loadNext(): Promise<QuestionnaireResponses> {
    if (!this.hasMore) {
      return new QuestionnaireResponses([], false);
    }
    const page = await this.service.getSuitabilityAnswers(this.nextCursor, 100);
    // we need to figure out if next cursor is returned as null or not
    this.nextCursor = page.nextCursor;
    this.hasMore = !!!(page.nextCursor) && page.nextCursor.length > 0;
    return new QuestionnaireResponses(
      page.questionnaires,
      this.hasMore
    );
  }
}
