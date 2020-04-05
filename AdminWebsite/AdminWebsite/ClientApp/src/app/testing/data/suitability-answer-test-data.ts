import { SuitabilityAnswerResponse } from '../../services/clients/api-client';
import { ParticipantSuitabilityAnswerResponse } from '../../services/clients/api-client';

export class SuitabilityAnswerTestData {

    plainResponse = new ParticipantSuitabilityAnswerResponse({
        case_number: '',
        first_name: '',
        last_name: '',
        title: '',
        hearing_role: 'Representative',
        representee: 'Ms X',
        answers: [
            new SuitabilityAnswerResponse({
                answer: 'Yes',
                extended_answer: 'Comments',
                key: 'ABOUT_YOU'
            })
        ]
    });

    someoneRepresentingTheCase = new ParticipantSuitabilityAnswerResponse({
        case_number: '1234',
        first_name: 'John',
        last_name: 'Conner',
        title: 'Mr',
        hearing_role: 'Representative',
        representee: 'Ms X',
        answers: [
            new SuitabilityAnswerResponse({
                answer: 'Yes',
                key: 'PRESENTING_THE_CASE'
            }),
            new SuitabilityAnswerResponse({
                answer: 'Philip Hammond',
                key: 'PRESENTING_NAME'
            }),

            new SuitabilityAnswerResponse({
                answer: 'chambers@west.co.uk',
                key: 'PRESENTING_EMAIL'
            })
        ]
    });
}
