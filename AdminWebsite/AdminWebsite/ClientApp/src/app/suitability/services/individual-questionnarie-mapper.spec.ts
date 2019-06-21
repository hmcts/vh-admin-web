import { IndividualQuestionsMapAttributes } from './suitability-answer.mapper';
import { SuatabilityAnswerTestData } from '../../testing/data/suitability-answer-test-data';
import { IndividualQuestionnarieMapper } from '../services/individual-questionnarie-mapper';

describe('QuestionnarieMapper', () => {
  const response = new SuatabilityAnswerTestData().response;

  it('should map all individual suitability questions to answers', async () => {
    const mapper = new IndividualQuestionnarieMapper(response.answers);
    const questions = mapper.mapAnswers();
    const attributes = new IndividualQuestionsMapAttributes();

    expect(questions).toBeTruthy();
    expect(questions.length).toBe(attributes.QuestionsOrder.length);
  });
});
