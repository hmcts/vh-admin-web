import { QuestionnaireService } from './questionnaire.service';
import { ParticipantQuestionnaire } from '../participant-questionnaire';

describe('QuestionnaireService', () => {
    let service: QuestionnaireService;

    beforeEach(() => {
        service = new QuestionnaireService();
    });

    it('returns next page of responses on second call', async () => {
        // if we call it once and then again
        const first = await service.loadNext();
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

        expect(thirdCall.items).toBe([]);
    });
});
