import { ParticipantSuitabilityAnswerResponse } from './../../services/clients/api-client';
import { QuestionnaireService } from './questionnaire.service';
import { ParticipantQuestionnaire } from '../participant-questionnaire';

class SuitabilityAnswersPage {
    participantAnswersResponse: ParticipantSuitabilityAnswerResponse[];
    nextPageCursor: string;
}

interface PagedSuitabilityAnswersService {
    getSuitabilityAnswers(cursor: string, limit: number): SuitabilityAnswersPage;
}

class MockPagedSuitabilityAnswersService implements PagedSuitabilityAnswersService {
    private readonly pages: SuitabilityAnswersPage[] = [];
    getSuitabilityAnswers(cursor: string, limit: number) {}
}

describe('QuestionnaireService', () => {
    let service: QuestionnaireService;

    const participantOneResponse = new ParticipantSuitabilityAnswerResponse({});
    const participantTwoResponse = new ParticipantSuitabilityAnswerResponse({});

    beforeEach(() => {
        service = new QuestionnaireService();
    });

    it('returns next page of responses on second call', async () => {
        // if we call it once
        const first = await service.loadNext();

        // and then again
        const second = await service.loadNext();

        // and convert each result to participants
        const firstParticipants = first.items.map((q: ParticipantQuestionnaire) => q.participantId);
        const secondParticipants = second.items.map((q: ParticipantQuestionnaire) => q.participantId);

        // first and second responses should have data
        expect(firstParticipants.length).toBeGreaterThan(0);
        expect(secondParticipants.length).toBeGreaterThan(0);

        // the second result should contain no responses from the first one
        for (const participantFromFirstCall of firstParticipants) {
            expect(secondParticipants).not.toContain(participantFromFirstCall);
        }
    });

    it('has no more items after second call', async () => {
        // when loading twice
        await service.loadNext();
        const secondResult = await service.loadNext();

        // then the second response notes that there are no more responses
        expect(secondResult.hasMore).toBe(false);
    });

    it('will return no more item after second call', async () => {
        await service.loadNext();
        await service.loadNext();
        const thirdCall = await service.loadNext();

        expect(thirdCall.items).toEqual([]);
    });
});
