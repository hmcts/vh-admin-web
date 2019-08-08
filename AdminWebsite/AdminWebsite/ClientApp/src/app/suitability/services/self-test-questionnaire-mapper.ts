import { SuitabilityAnswerResponse } from '../../services/clients/api-client';
import {  SelfTestQuestionsMapAttributes} from './suitability-answer.mapper';
import { QuestionnaireMapper } from './questionnaire-mapper';

export class SelfTestQuestionnaireMapper extends QuestionnaireMapper {
  constructor(answers: SuitabilityAnswerResponse[]) {
    const attributes = new SelfTestQuestionsMapAttributes();
    super(answers, attributes);
  }
}
