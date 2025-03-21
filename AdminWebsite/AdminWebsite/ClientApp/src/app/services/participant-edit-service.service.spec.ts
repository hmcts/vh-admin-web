import { of } from 'rxjs';
import { MockLogger } from '../shared/testing/mock-logger';
import { BHClient, BookHearingException, PersonResponseV2 } from './clients/api-client';
import { ParticipantEditService } from './participant-edit-service.service';

describe('ParticipantDeleteServiceService', () => {
    let apiClient: jasmine.SpyObj<BHClient>;
    let service: ParticipantEditService;

    beforeEach(() => {
        apiClient = jasmine.createSpyObj<BHClient>('BHClient', ['getPersonForUpdateByContactEmail', 'deletePersonWithUsername']);
        service = new ParticipantEditService(apiClient, new MockLogger());
    });

    it('should return null if api returns an error', async () => {
        apiClient.getPersonForUpdateByContactEmail.and.throwError('unit test error');
        const result = await service.searchForPerson('user@hmcts.net');
        expect(result).toBeNull();
    });

    it('should throw exception when api returns 401', async () => {
        const exception = new BookHearingException('Unauthorized', 401, 'Only searches for non Judge persons are allowed', null, null);
        apiClient.getPersonForUpdateByContactEmail.and.callFake(() => {
            throw exception;
        });
        let actualError: BookHearingException;
        try {
            await service.searchForPerson('user@hmcts.net');
        } catch (error) {
            actualError = error;
        }
        expect(actualError).toBe(exception);
    });

    it('should return person', async () => {
        const existingPerson = new PersonResponseV2({
            id: 'id',
            first_name: 'John',
            last_name: 'Doe',
            username: 'test@hmcts.net'
        });
        apiClient.getPersonForUpdateByContactEmail.and.returnValue(of(existingPerson));

        const response = await service.searchForPerson('user@hmcts.net');
        expect(response).toBeDefined();
        expect(response.personId).toBe(existingPerson.id);
        expect(response.firstname).toBe(existingPerson.first_name);
        expect(response.lastName).toBe(existingPerson.last_name);
        expect(response.currentUsername).toBe(existingPerson.username);
        expect(response.fullName).toBe(`${existingPerson.first_name} ${existingPerson.last_name}`);
    });
});
