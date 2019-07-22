import { SuitabilityAnswer } from './../participant-questionnaire';
import { SuitabilityAnswerResponse } from './../../services/clients/api-client';
import { QuestionsMapAttributes } from './suitability-answer.mapper';

export class QuestionnarieMapper {

  constructor(answers: SuitabilityAnswerResponse[], mapAttributes: QuestionsMapAttributes) {
    this.answers = answers;
    this.attributes = mapAttributes;
  }

  answers: SuitabilityAnswerResponse[];
  attributes: QuestionsMapAttributes;

  public mapAnswers(): SuitabilityAnswer[] {
    return this.attributes.QuestionsOrder.map(s => {
      const data = this.mapAnswer(s);
      return new SuitabilityAnswer(
        {
          question: this.attributes.Questions.get(s),
          answer: data.answer,
          notes: data.note
        });
    });
  }

  private mapAnswer(key: string) {
    const findAnswer = this.answers.find(x => x.key === key);
    return {
      answer: !!findAnswer ? this.translateAnswer(findAnswer.answer) : 'Not answered',
      note: !!findAnswer ? findAnswer.extended_answer : ''
    };
  }

  // Translates answers into readable format
  private translateAnswer(answer: string) {
    switch (answer) {
      case 'true': return 'Yes';
      case 'false': return 'No';
      default: return answer;
    }
  }
}
