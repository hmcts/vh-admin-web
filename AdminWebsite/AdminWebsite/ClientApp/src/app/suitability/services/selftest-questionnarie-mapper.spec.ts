import { SelfTestQuestionsMapAttributes } from './suitability-answer.mapper';
import { SuatabilityAnswerTestData } from '../../testing/data/suitability-answer-test-data';
import { SelfTestQuestionnaireMapper } from './self-test-questionnaire-mapper';

describe('QuestionnaireMapper', () => {
  const response = new SuatabilityAnswerTestData().response;

  it('should map all self test questions to answers', async () => {
    const mapper = new SelfTestQuestionnaireMapper(response.answers);
    const questions = mapper.mapAnswers();
    const attributes = new SelfTestQuestionsMapAttributes();

    expect(questions).toBeTruthy();
    expect(questions.length).toBe(attributes.QuestionsOrder.length);
  });
});
