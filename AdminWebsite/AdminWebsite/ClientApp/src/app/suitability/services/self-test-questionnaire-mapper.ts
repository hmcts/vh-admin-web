import { SuitabilityAnswerResponse } from '../../services/clients/api-client';
import { SelfTestQuestionsMapAttributes } from './suitability-answer.mapper';
import { QuestionnaireMapper } from './questionnaire-mapper';

export class SelfTestQuestionnaireMapper extends QuestionnaireMapper {
    constructor(answers: SuitabilityAnswerResponse[]) {
        super(answers, new SelfTestQuestionsMapAttributes());
    }
}
