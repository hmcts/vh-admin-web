import { Injectable } from '@angular/core';
import { ParticipantSuitabilityAnswerResponse } from './../../services/clients/api-client';
import { QuestionnaireMapper } from './questionnaire-mapper';
import { RepresentativeQuestionnaireMapper } from './representative-questionnaire-mapper';
import { IndividualQuestionnaireMapper } from './individual-questionnaire-mapper';
import { SelfTestQuestionnaireMapper } from './self-test-questionnaire-mapper';

@Injectable()
export class QuestionnaireMapperFactory {

  public getSuitabilityMapper(response: ParticipantSuitabilityAnswerResponse): QuestionnaireMapper {
    if (response.representee && response.representee.length > 0) {
      return new RepresentativeQuestionnaireMapper(response.answers);
    } else {
      return new IndividualQuestionnaireMapper(response.answers);
    }
  }

  public getSelfTestMapper(response: ParticipantSuitabilityAnswerResponse): QuestionnaireMapper {
    return new SelfTestQuestionnaireMapper(response.answers);
  }
}
