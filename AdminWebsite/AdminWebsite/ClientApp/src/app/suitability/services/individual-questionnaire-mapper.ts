import {SuitabilityAnswerResponse} from '../../services/clients/api-client';
import {IndividualQuestionsMapAttributes} from './suitability-answer.mapper';
import {QuestionnaireMapper} from './questionnaire-mapper';

export class IndividualQuestionnaireMapper extends QuestionnaireMapper {
  constructor(answers: SuitabilityAnswerResponse[]) {
    super(answers, new IndividualQuestionsMapAttributes());
  }
}
