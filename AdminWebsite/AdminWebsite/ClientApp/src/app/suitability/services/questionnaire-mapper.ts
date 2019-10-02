import {EmbeddedSuitabilityQuestionAnswer, SuitabilityAnswer} from '../participant-questionnaire';
import {SuitabilityAnswerResponse} from '../../services/clients/api-client';
import {QuestionAnswer, QuestionsMapAttributes} from './suitability-answer.mapper';

export abstract class QuestionnaireMapper {

  protected constructor(answers: SuitabilityAnswerResponse[], mapAttributes: QuestionsMapAttributes) {
    this.answers = answers;
    this.attributes = mapAttributes;
  }

  protected answers: SuitabilityAnswerResponse[];
  protected attributes: QuestionsMapAttributes;

  public mapAnswers(): SuitabilityAnswer[] {
    return this.attributes.QuestionsOrder.map(s => {
      const questionAnswer = this.attributes.Questions.get(s);
      const data = this.mapAnswer(s, questionAnswer);

      return new SuitabilityAnswer(
        {
          question: questionAnswer.Question,
          answer: data.answer,
          notes: data.note,
          embeddedQuestionAnswers: data.embeddedQuestionAnswers
        });
    });
  }

  private mapAnswer(key: string, questionAnswer: QuestionAnswer) {
    const findAnswer = this.answers.find(x => x.key === key);
    return {
      answer: !!findAnswer
        ? this.translateAnswer(findAnswer.answer)
        : questionAnswer.DefaultAnswer === undefined ? 'Not answered' : questionAnswer.DefaultAnswer,
      note: !!findAnswer ? findAnswer.extended_answer : '',
      embeddedQuestionAnswers: this.getEmbeddedNotes(questionAnswer)
    };
  }

  private translateAnswer(answer: string) {
    switch (answer) {
      case 'true':
        return 'Yes';
      case 'false':
        return 'No';
      default:
        return this.getFromTranslationMap(answer);
    }
  }

  private getEmbeddedNotes(questionAnswer: QuestionAnswer) {
    let hasAnyAnswers = false;
    const map = new Array<EmbeddedSuitabilityQuestionAnswer>();

    if (questionAnswer.EmbeddedAnswersInNotes !== undefined && questionAnswer.EmbeddedAnswersInNotes.length > 0) {
      questionAnswer.EmbeddedAnswersInNotes.forEach(x => {

        if (this.attributes.Questions.has(x)) {
          const question = this.attributes.Questions.get(x);
          const findAnswer = this.answers.find(y => y.key === x);
          const answer = findAnswer !== undefined ? findAnswer.answer : '';

          if (answer !== '') {
            hasAnyAnswers = true;
          }

          map.push({question: question.Question, answer: answer});
        }
      });

      return hasAnyAnswers ? map : null;
    }
  }

  protected getFromTranslationMap(answer: string): string {
    if (this.attributes.AnswerOverrides.has(answer)) {
      return this.attributes.AnswerOverrides.get(answer);
    }

    return answer;
  }
}
