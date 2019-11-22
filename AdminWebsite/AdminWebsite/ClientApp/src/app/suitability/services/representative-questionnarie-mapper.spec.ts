import {RepresentativeQuestionsMapAttributes} from './suitability-answer.mapper';
import {SuitabilityAnswerTestData} from '../../testing/data/suitability-answer-test-data';
import {RepresentativeQuestionnaireMapper} from './representative-questionnaire-mapper';

describe('QuestionnaireMapper', () => {
  it('should map all representative suitability questions to answers', async () => {
    const verboseResponse = new SuitabilityAnswerTestData().someoneRepresentingTheCase;
    const mapper = new RepresentativeQuestionnaireMapper(verboseResponse.answers);
    const questions = mapper.mapAnswers();
    const attributes = new RepresentativeQuestionsMapAttributes();

    expect(questions).toBeTruthy();
    expect(questions.length).toBeGreaterThan(0);

    const appointQuestion = questions.find(x => x.question === 'Someone will be representing the case?');
    expect(appointQuestion).toBeDefined();
    expect(appointQuestion.answer).toBe('Yes');
    expect(appointQuestion.embeddedQuestionAnswers).toBeDefined();
    expect(appointQuestion.embeddedQuestionAnswers.length).toBe(3);
  });
});
