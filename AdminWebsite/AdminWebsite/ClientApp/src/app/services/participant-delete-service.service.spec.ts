import { of } from 'rxjs';
import { BHClient, HearingsByUsernameForDeletionResponse } from './clients/api-client';
import { ParticipantDeleteServiceService } from './participant-delete-service.service';

describe('ParticipantDeleteServiceService', () => {
    let apiClient: jasmine.SpyObj<BHClient>;
    let service: ParticipantDeleteServiceService;

    beforeEach(() => {
        apiClient = jasmine.createSpyObj<BHClient>('BHClient', ['getHearingsByUsernameForDeletion']);
        service = new ParticipantDeleteServiceService(apiClient);
    });

    it('should get list of hearings for username', async () => {
        const hearings = [
            new HearingsByUsernameForDeletionResponse({
                case_name: 'case1',
                case_number: '123',
                scheduled_date_time: new Date(),
                venue: 'venue1'
            }),
            new HearingsByUsernameForDeletionResponse({
                case_name: 'case2',
                case_number: '234',
                scheduled_date_time: new Date(),
                venue: 'venue2'
            }),
            new HearingsByUsernameForDeletionResponse({
                case_name: 'case3',
                case_number: '345',
                scheduled_date_time: new Date(),
                venue: 'venue1'
            })
        ];
        apiClient.getHearingsByUsernameForDeletion.and.returnValue(of(hearings));
        const result = await service.getHearingsForUsername('user@test.com');
        expect(result).toEqual(hearings);
    });

    it('should return null if api returns an error', async () => {
        apiClient.getHearingsByUsernameForDeletion.and.throwError('unit test error');
        const result = await service.getHearingsForUsername('user@test.com');
        expect(result).toBeNull();
    });
});
