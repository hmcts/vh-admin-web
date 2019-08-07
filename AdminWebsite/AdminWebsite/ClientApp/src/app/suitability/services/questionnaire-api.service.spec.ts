import { BHClient, SuitabilityAnswersResponse } from './../../services/clients/api-client';
import { QuestionnaireApiService } from './questionnaire-api.service';
import { QuestionnaireMapperFactory } from './questionnaire-mapper-factory.service';
import { of } from 'rxjs';

describe('QuestionnaireApiService', () => {
    let service: QuestionnaireApiService;
    let client: jasmine.SpyObj<BHClient>;
    let factory: QuestionnaireMapperFactory;

    beforeEach(() => {
        client = jasmine.createSpyObj<BHClient>(['getSuitabilityAnswers']);
        factory = new QuestionnaireMapperFactory();
        service = new QuestionnaireApiService(client, factory);
    });

    it('calls api', async () => {
        const response = new SuitabilityAnswersResponse({
            participant_suitability_answer_response: [],
            next_cursor: null
        });
        client.getSuitabilityAnswers.and.returnValue(of(response));
        const x = await service.getSuitabilityAnswers('', 2);
        expect(client.getSuitabilityAnswers).toHaveBeenCalled();
    });
});
