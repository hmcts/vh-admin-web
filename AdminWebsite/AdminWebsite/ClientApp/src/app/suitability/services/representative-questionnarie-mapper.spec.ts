import { RepresentativeQuestionsMapAttributes } from './suitability-answer.mapper';
import { SuatabilityAnswerTestData } from '../../testing/data/suitability-answer-test-data';
import { RepresentativeQuestionnaireMapper } from './representative-questionnaire-mapper';

describe('QuestionnaireMapper', () => {
  const response = new SuatabilityAnswerTestData().response;

  it('should map all representative suitability questions to answers', async () => {
    const mapper = new RepresentativeQuestionnaireMapper(response.answers);
    const questions = mapper.mapAnswers();
    const attributes = new RepresentativeQuestionsMapAttributes();

    expect(questions).toBeTruthy();
    expect(questions.length).toBe(attributes.QuestionsOrder.length);
  });
});
