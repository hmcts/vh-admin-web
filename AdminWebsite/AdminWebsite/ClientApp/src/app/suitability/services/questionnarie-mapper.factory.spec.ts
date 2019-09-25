import { RepresentativeQuestionnaireMapper } from './representative-questionnaire-mapper';
import { IndividualQuestionnaireMapper } from './individual-questionnaire-mapper';
import { SelfTestQuestionnaireMapper } from './self-test-questionnaire-mapper';
import { QuestionnaireMapperFactory } from './questionnaire-mapper-factory.service';
import { SuitabilityAnswerTestData } from '../../testing/data/suitability-answer-test-data';

describe('QuestionnaireMapperFactory', () => {
  let factory: QuestionnaireMapperFactory;
  const response = new SuitabilityAnswerTestData().plainResponse;

  beforeEach(() => {
    factory = new QuestionnaireMapperFactory();
  });

  it('should return mapper for representative suitability questions', () => {
    const mapper = factory.getSuitabilityMapper(response);
    expect(mapper instanceof RepresentativeQuestionnaireMapper).toBeTruthy();
  });
  it('should return mapper for individual suitability questions', () => {
    response.representee = '';
    const mapper = factory.getSuitabilityMapper(response);
    expect(mapper instanceof IndividualQuestionnaireMapper).toBeTruthy();
  });
  it('should return mapper for self test questions', () => {
    const mapper = factory.getSelfTestMapper(response);
    expect(mapper instanceof SelfTestQuestionnaireMapper).toBeTruthy();
  });
});
