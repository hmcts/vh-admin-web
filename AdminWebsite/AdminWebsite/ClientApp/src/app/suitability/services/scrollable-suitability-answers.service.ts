import { ParticipantQuestionnaire } from '../participant-questionnaire';

export abstract class ScrollableSuitabilityAnswersService {
    abstract getSuitabilityAnswers(cursor: string, limit: number): Promise<SuitabilityAnswersPage>;
}

export class SuitabilityAnswersPage {
    questionnaires: ParticipantQuestionnaire[];
    nextCursor: string;
}
