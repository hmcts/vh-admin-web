import { SuitabilityAnswerResponse } from './../../services/clients/api-client';
import {  SelfTestQuestionsMapAttributes} from './suitability-answer.mapper';
import { QuestionnarieMapper } from './questionnarie-mapper';

export class SelfTestQuestionnarieMapper extends QuestionnarieMapper {
  constructor(answers: SuitabilityAnswerResponse[]) {
    const attributes = new SelfTestQuestionsMapAttributes();
    super(answers, attributes);
  }
}
