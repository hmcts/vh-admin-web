import {SuitabilityAnswerResponse} from '../../services/clients/api-client';
import {RepresentativeQuestionsMapAttributes} from './suitability-answer.mapper';
import {QuestionnaireMapper} from './questionnaire-mapper';

export class RepresentativeQuestionnaireMapper extends QuestionnaireMapper {
  constructor(answers: SuitabilityAnswerResponse[]) {
    super(answers, new RepresentativeQuestionsMapAttributes());
  }
}
