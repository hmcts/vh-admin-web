import { RepresentativeQuestionsMapAttributes } from './suitability-answer.mapper';
import { SuatabilityAnswerTestData } from '../../testing/data/suitability-answer-test-data';
import { RepresentativeQuestionnarieMapper } from '../services/representative-questionnarie-mapper';

describe('QuestionnarieMapper', () => {
  const response = new SuatabilityAnswerTestData().response;

  it('should map all representative suitability questions to answers', async () => {
    const mapper = new RepresentativeQuestionnarieMapper(response.answers);
    const questions = mapper.mapAnswers();
    const attributes = new RepresentativeQuestionsMapAttributes();

    expect(questions).toBeTruthy();
    expect(questions.length).toBe(attributes.QuestionsOrder.length);
  });
});
