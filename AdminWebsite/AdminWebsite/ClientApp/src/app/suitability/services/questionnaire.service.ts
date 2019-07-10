import { Injectable } from '@angular/core';
import { ParticipantQuestionnaire } from '../participant-questionnaire';
import { ScrollableSuitabilityAnswersService } from './scrollable-suitability-answers.service';

export class QuestionnaireResponses {
  readonly items: ParticipantQuestionnaire[];
  readonly hasMore: boolean;
  readonly nextCursor: string;

  constructor(items: ParticipantQuestionnaire[], hasMore: boolean, nextCursor: string) {
    this.items = items;
    this.hasMore = hasMore;
    this.nextCursor = nextCursor;
  }
}

@Injectable()
export class QuestionnaireService {

  constructor(private service: ScrollableSuitabilityAnswersService) { }

  async loadNext(nextCursor: string): Promise<QuestionnaireResponses> {

    const page = await this.service.getSuitabilityAnswers(nextCursor, 100);

    // we need to figure out if next cursor is returned as null or not
    return new QuestionnaireResponses(
      page.questionnaires,
      !!page.nextCursor,
      page.nextCursor
    );
  }
}
