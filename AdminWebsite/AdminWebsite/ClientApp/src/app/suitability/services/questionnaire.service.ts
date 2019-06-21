import { map } from 'rxjs/operators';
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

  private alreadyReturnedIds = new Set<string>();

  constructor(private service: ScrollableSuitabilityAnswersService) { }

  async loadNext(): Promise<QuestionnaireResponses> {
    if (!this.hasMore) {
      return new QuestionnaireResponses([], false);
    }
    const page = await this.service.getSuitabilityAnswers(this.nextCursor, 100);

    // deduplication since the service may return items twice
    const questionnaires = this.filterReturned(page.questionnaires);
    this.addToReturned(questionnaires);

    // we need to figure out if next cursor is returned as null or not
    this.nextCursor = page.nextCursor;
    this.hasMore = !!page.nextCursor;
    return new QuestionnaireResponses(
      questionnaires,
      this.hasMore
    );
  }

  private addToReturned(questionnaires: ParticipantQuestionnaire[]) {
    const ids = questionnaires.map((q: ParticipantQuestionnaire) => q.participantId);
    ids.forEach((id: string) => this.alreadyReturnedIds.add(id));
  }

  private filterReturned(questionnaires: ParticipantQuestionnaire[]): ParticipantQuestionnaire[] {
    return questionnaires.filter((q: ParticipantQuestionnaire) => {
      return !this.alreadyReturnedIds.has(q.participantId);
    });
  }
}
