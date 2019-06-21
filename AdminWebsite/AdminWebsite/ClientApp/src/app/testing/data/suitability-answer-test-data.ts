import { SuitabilityAnswerResponse } from './../../services/clients/api-client';
import { ParticipantSuitabilityAnswerResponse } from './../../services/clients/api-client';

export class SuatabilityAnswerTestData {

  response = new ParticipantSuitabilityAnswerResponse({
    case_number: '',
    first_name: '',
    last_name: '',
    title: '',
    hearing_role: 'Solicitor',
    representee: 'Ms X',
    answers: [
      new SuitabilityAnswerResponse({
        answer: 'Yes',
        extended_answer: 'Comments',
        key: 'ABOUT_YOU'
      })
    ]
  });
}
