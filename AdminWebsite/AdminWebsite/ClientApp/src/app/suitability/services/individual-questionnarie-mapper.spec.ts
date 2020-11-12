import { IndividualQuestionsMapAttributes } from './suitability-answer.mapper';
import { SuitabilityAnswerTestData } from '../../testing/data/suitability-answer-test-data';
import { IndividualQuestionnaireMapper } from './individual-questionnaire-mapper';

describe('IndividualQuestionnaireMapper', () => {
    const response = new SuitabilityAnswerTestData().plainResponse;

    it('should map all individual suitability questions to answers', async () => {
        const mapper = new IndividualQuestionnaireMapper(response.answers);
        const questions = mapper.mapAnswers();
        const attributes = new IndividualQuestionsMapAttributes();

        expect(questions).toBeTruthy();
        expect(questions.length).toBeGreaterThan(0);
        expect(questions.length).toBe(attributes.QuestionsOrder.length);

        questions.forEach(x => expect(x.embeddedQuestionAnswers).toBeUndefined());
    });
});
