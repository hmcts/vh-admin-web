import { ParticipantQuestionnaire, SuitabilityAnswerGroup, SuitabilityAnswer } from './../participant-questionnaire';
import { ParticipantSuitabilityAnswerResponse, SuitabilityAnswerResponse } from './../../services/clients/api-client';
import { BHClient } from 'src/app/services/clients/api-client';
import { Injectable } from '@angular/core';
import { ScrollableSuitabilityAnswersService, SuitabilityAnswersPage } from './scrollable-suitability-answers.service';
import { IndividualQuestionKeys, RepresentativeQuestionKeys } from './suitability-answer.mapper';


@Injectable()
export class QuestionnaireApiService implements ScrollableSuitabilityAnswersService {
  constructor(private client: BHClient) { }

  individualSuitabilityKeysOrder = [
    'ABOUT_YOU',
    'INTERPRETER',
    'COMPUTER',
    'CAMERA_MICROPHONE',
    'INTERNET',
    'ROOM',
    'CONSENT'
  ];

  representativeSuitabilityKeysOrder = [
    'ABOUT_YOU',
    'ROOM',
    'COMPUTER',
    'CAMERA_MICROPHONE',
    'ABOUT_YOUR_CLIENT',
    'CLIENT_ATTENDANCE',
    'HEARING_SUITABILITY'
  ];

  equipmentCheckKeyOrder = [
    'SEE_YOURSELF',
    'SPEAKERS',
    'SEE_HEAR_CLEARLY'
  ];

  readonly equipmentCheck = new Map<string, string>([
    ['SEE_YOURSELF', 'Could you see yourself on the screen in the camera window?'],
    ['SPEAKERS', 'Could you see the bar moving when you spoke?'],
    ['SEE_HEAR_CLEARLY', 'Could you see and hear the video clearly?']
  ]);

  readonly questionsIndividual = new Map<string, string>([
    [IndividualQuestionKeys.AboutYou, 'Is there anything you\'d like the court to take into account when it decides which type of hearing will be suitable?'
    ],
    [IndividualQuestionKeys.Interpreter, 'Will you need an interpreter for your hearing?'],
    [IndividualQuestionKeys.Computer, 'Will you have access to a laptop or desktop computer (not a mobile, not a tablet)?'],
    [IndividualQuestionKeys.Camera, 'Does your computer have a camera and microphone'],
    [IndividualQuestionKeys.Internet, 'At the time of your hearing, will the computer be able to access the internet?'],
    [IndividualQuestionKeys.Room, 'At the time of your hearing, will you have access to a quiet, private room?'],
    [IndividualQuestionKeys.Consent, 'Would you be content to take part in your hearing by video?']
  ]);

  readonly questionsRepresentative = new Map<string, string>([
    [RepresentativeQuestionKeys.AboutYou, 'Is there anything that could affect your ability to take part in a video hearing?'],
    [RepresentativeQuestionKeys.Room, 'Will you have access to a quiet, private room where you can connect to the internet and where your client can sit with you?'],
    [RepresentativeQuestionKeys.Computer, 'Will you have access to a laptop or desktop computer (not a mobile, not a tablet)?'],
    [RepresentativeQuestionKeys.Camera, 'Does your computer have a camera and microphone'],
    [RepresentativeQuestionKeys.AboutYourClient, 'Is there anything that could affect your client\'s ability to take part in a video hearing?'],
    [RepresentativeQuestionKeys.ClientAttendance, 'Will your client be attending the hearing?'],
    [RepresentativeQuestionKeys.HearingSuitability, 'Is there anything about this case you think makes it unsuitable for a video hearing?']
  ]);

  async getSuitabilityAnswers(cursor: string, limit: number): Promise<SuitabilityAnswersPage> {
    const response = await this.client.getSuitabilityAnswers(cursor, limit).toPromise();
    const page = new SuitabilityAnswersPage();
    page.nextCursor = response.next_cursor;
    page.questionnaires = response.participant_suitability_answer_response.map(item => this.map(item));
    return page;
  }

  private map(response: ParticipantSuitabilityAnswerResponse): ParticipantQuestionnaire {
    return new ParticipantQuestionnaire({
      displayName: `${response.first_name} ${response.last_name}`,
      caseNumber: response.case_number,
      hearingRole: response.hearing_role,
      representee: response.representee,
      participantId: response.participant_id,
      updatedAt: response.updated_at,
      answers: this.mapAnswerGroups(response.answers, response.hearing_role && response.hearing_role.toLowerCase().indexOf('solicitor') > -1),
    });
  }

  private mapAnswerGroups(answers: SuitabilityAnswerResponse[], isRepresentative: boolean): SuitabilityAnswerGroup[] {
    return [
      new SuitabilityAnswerGroup({
        title: 'About you and your equipment',
        answers: !isRepresentative ? this.mapAnswers(answers, this.individualSuitabilityKeysOrder, this.questionsIndividual)
          : this.mapAnswers(answers, this.representativeSuitabilityKeysOrder, this.questionsRepresentative)
      }),
      new SuitabilityAnswerGroup({
        title: 'Equipment check',
        answers: this.mapAnswers(answers, this.equipmentCheckKeyOrder, this.equipmentCheck)
      }),
    ];
  }

  private mapAnswers(answers: SuitabilityAnswerResponse[], order: string[], questions: Map<string, string>): SuitabilityAnswer[] {
    return order.map(s => {
      const data = this.mapAnswer(answers, s);
      return new SuitabilityAnswer(
        {
          question: questions.get(s),
          answer: data.answer,
          notes: data.note
        })
    });
  }

  private mapAnswer(answers: SuitabilityAnswerResponse[], key: string) {
    const findAnswer = answers.find(x => x.key === key);
    return {
      answer: !!findAnswer ? findAnswer.answer : 'Not answered',
      note: !!findAnswer ? findAnswer.extended_answer : ''
    }
  }
}
