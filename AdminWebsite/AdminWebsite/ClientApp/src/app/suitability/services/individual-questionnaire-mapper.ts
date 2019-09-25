import { SuitabilityAnswerResponse } from '../../services/clients/api-client';
import {  IndividualQuestionsMapAttributes} from './suitability-answer.mapper';
import { QuestionnaireMapper } from './questionnaire-mapper';

export class IndividualQuestionnaireMapper extends QuestionnaireMapper {
  constructor(answers: SuitabilityAnswerResponse[]) {
    const attributes = new IndividualQuestionsMapAttributes();
    super(answers, attributes);
  }

  protected getFromTranslationMap(answer: string): string {
    return 'IndividualQuestionnaireMapper';
  }
}
