import { ServicesModule } from './../../services/services.module';
import { QuestionnaireService } from './questionnaire.service';
import { ParticipantQuestionnaire } from '../participant-questionnaire';
import { ApiStub } from './api-stub.spec';

describe('QuestionnaireService', () => {
    let service: QuestionnaireService;
    let apiStub: ApiStub;

    const participantOneResponse = new ParticipantQuestionnaire({
        participantId: 'id1',
        displayName: 'participant one',
        updatedAt: new Date(),
        caseNumber: 'a',
        hearingRole: 'Claimant',
        representee: '',
        answers: []
    });
    const participantTwoResponse = new ParticipantQuestionnaire({
        participantId: 'id2',
        displayName: 'participant two',
        caseNumber: 'a',
        updatedAt: new Date(),
        hearingRole: 'Claimant',
        representee: '',
        answers: []
    });

    beforeEach(() => {
        apiStub = new ApiStub();
        service = new QuestionnaireService(apiStub);
    });

    it('returns next page of responses on second call', async () => {
        // if we call it once
        apiStub.forFirstCall().returnsWithResponse({
            questionnaires: [ participantOneResponse ],
            nextCursor: 'cursor1'
        });
        const first = await service.loadNext();

        // and then again
        apiStub.forCursor('cursor1').returnsWithResponse({
            questionnaires: [ participantTwoResponse ],
            nextCursor: ''
        });
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

    it('has no more items if no next cursor is returned', async () => {
        // when loading twice
        apiStub.forFirstCall().returnsWithResponse({
            questionnaires: [ participantOneResponse ],
            nextCursor: ''
        });
        const result = await service.loadNext();

        expect(result.hasMore).toBe(false);
    });

    it('will return no items if there is no next cursor', async () => {
        apiStub.forFirstCall().returnsWithResponse({
            questionnaires: [],
            nextCursor: ''
        });
        await service.loadNext();

        const secondCall = await service.loadNext();

        expect(secondCall.items).toEqual([]);
    });

    it('removes duplicates returned from api', async () => {
        // given the service returns a duplicated entry on the second call
        // which can happen due to the nature of cursors and infinite scroll api's
        apiStub.forFirstCall().returnsWithResponse({
            questionnaires: [ participantOneResponse ],
            nextCursor: 'nextpage'
        });
        apiStub.forCursor('nextpage').returnsWithResponse({
            questionnaires: [ participantOneResponse ],
            nextCursor: ''
        });

        // when calling the service next
        await service.loadNext();
        const secondCall = await service.loadNext();

        // the service deduplicates this, removing the second entry
        expect(secondCall.items).toEqual([]);
    });
});
