import { SuitabilityAnswerResponse } from './../../services/clients/api-client';
import { RepresentativeQuestionsMapAttributes } from './suitability-answer.mapper';
import { QuestionnarieMapper } from './questionnarie-mapper';

export class RepresentativeQuestionnarieMapper extends QuestionnarieMapper {
  constructor(answers: SuitabilityAnswerResponse[]) {
    const attributes = new RepresentativeQuestionsMapAttributes();
    super(answers, attributes);
  }
}
