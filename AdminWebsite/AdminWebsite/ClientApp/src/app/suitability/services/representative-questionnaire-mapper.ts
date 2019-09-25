import {SuitabilityAnswerResponse} from '../../services/clients/api-client';
import {RepresentativeQuestionsMapAttributes} from './suitability-answer.mapper';
import {QuestionnaireMapper} from './questionnaire-mapper';

export class RepresentativeQuestionnaireMapper extends QuestionnaireMapper {
  constructor(answers: SuitabilityAnswerResponse[]) {
    super(answers, new RepresentativeQuestionsMapAttributes());
  }

  protected getFromTranslationMap(answer: string): string {
    if (this.attributes.AnswerOverrides.has(answer)) {
      return this.attributes.AnswerOverrides.get(answer);
    }

    return answer;
  }
}
