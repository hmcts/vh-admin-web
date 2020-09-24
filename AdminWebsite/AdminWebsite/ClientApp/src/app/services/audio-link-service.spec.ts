import { AudioLinkService } from './audio-link-service';
import { BHClient, HearingAudioRecordingResponse, HearingsForAudioFileSearchResponse } from './clients/api-client';
import { MockLogger } from '../shared/testing/mock-logger';
import { of } from 'rxjs';

describe('AudioLinkService', () => {
    let apiClient: jasmine.SpyObj<BHClient>;
    let service: AudioLinkService;

    beforeAll(() => {
        apiClient = jasmine.createSpyObj<BHClient>('BHClient', ['getHearingsByCaseNumber', 'getAudioRecordingLink']);

        service = new AudioLinkService(apiClient, new MockLogger());
    });

    it('should get the hearing by case number', async () => {
        const hearings = [
            new HearingsForAudioFileSearchResponse({ id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC4' }),
            new HearingsForAudioFileSearchResponse({ id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC5' }),
            new HearingsForAudioFileSearchResponse({ id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC6' })
        ];

        apiClient.getHearingsByCaseNumber.and.returnValue(of(hearings));
        const result = await service.getHearingsByCaseNumber('case number');
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result.length).toBe(3);
    });

    it('should return null when getting the hearing by case number', async () => {
        apiClient.getHearingsByCaseNumber.and.throwError('error');
        const result = await service.getHearingsByCaseNumber('case number');
        expect(result).toBeNull();
    });

    it('should get the audio link', async () => {
        const hearingAudioRecordingResponse = [new HearingAudioRecordingResponse({ audio_file_link: 'someUrl' })];
        apiClient.getAudioRecordingLink.and.returnValue(of(hearingAudioRecordingResponse));
        const result = await service.getAudioLink('hearingId');
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result[0]).toBe(hearingAudioRecordingResponse[0].audio_file_link);
    });
});
