import { RepresentativeQuestionnarieMapper } from './representative-questionnarie-mapper';
import { IndividualQuestionnarieMapper } from './individual-questionnarie-mapper';
import { SelfTestQuestionnarieMapper } from './selftest-questionnarie-mapper';
import { QuestionnarieMapperFactory } from './questionnarie-mapper.factory';
import { SuatabilityAnswerTestData } from '../../testing/data/suitability-answer-test-data';

describe('QuestionnarieMapperFactory', () => {
  let factory: QuestionnarieMapperFactory;
  const response = new SuatabilityAnswerTestData().response;

  beforeEach(() => {
    factory = new QuestionnarieMapperFactory();
  });

  it('should return mapper for representative suitability questions', () => {
    const mapper = factory.getSuitabilityMapper(response);
    expect(mapper instanceof RepresentativeQuestionnarieMapper).toBeTruthy();
  });
  it('should return mapper for individual suitability questions', () => {
    response.hearing_role = 'Claimant';
    const mapper = factory.getSuitabilityMapper(response);
    expect(mapper instanceof IndividualQuestionnarieMapper).toBeTruthy();
  });
  it('should return mapper for self test questions', () => {
    const mapper = factory.getSelfTestMapper(response);
    expect(mapper instanceof SelfTestQuestionnarieMapper).toBeTruthy();
  });
});
