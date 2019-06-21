import { SuitabilityAnswerResponse } from './../../services/clients/api-client';
import {  IndividualQuestionsMapAttributes} from './suitability-answer.mapper';
import { QuestionnarieMapper } from './questionnarie-mapper';

export class IndividualQuestionnarieMapper extends QuestionnarieMapper {
  constructor(answers: SuitabilityAnswerResponse[]) {
    const attributes = new IndividualQuestionsMapAttributes();
    super(answers, attributes);
  }
}
