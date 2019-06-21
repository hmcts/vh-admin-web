import { Injectable } from '@angular/core';
import { ParticipantSuitabilityAnswerResponse } from './../../services/clients/api-client';
import { QuestionnarieMapper } from './questionnarie-mapper';
import { RepresentativeQuestionnarieMapper } from './representative-questionnarie-mapper';
import { IndividualQuestionnarieMapper } from './individual-questionnarie-mapper';
import { SelfTestQuestionnarieMapper } from './selftest-questionnarie-mapper';

@Injectable()
export class QuestionnarieMapperFactory {

  public getSuitabilityMapper(response: ParticipantSuitabilityAnswerResponse): QuestionnarieMapper {
    if (response.hearing_role && response.hearing_role.toLowerCase().indexOf('solicitor') > -1) {
      return new RepresentativeQuestionnarieMapper(response.answers);
    } else {
      return new IndividualQuestionnarieMapper(response.answers);
    }
  }

  public getSelfTestMapper(response: ParticipantSuitabilityAnswerResponse): QuestionnarieMapper {
    return new SelfTestQuestionnarieMapper(response.answers);
  }
}
