import { of } from 'rxjs';
import { MockLogger } from '../shared/testing/mock-logger';
import { AudioLinkService } from './audio-link-service';
import { BHClient, HearingAudioRecordingResponse, HearingsForAudioFileSearchResponse } from './clients/api-client';

describe('AudioLinkService', () => {
    let apiClient: jasmine.SpyObj<BHClient>;
    let service: AudioLinkService;

    beforeAll(() => {
        apiClient = jasmine.createSpyObj<BHClient>('BHClient', ['searchForAudioRecordedHearings', 'getAudioRecordingLink']);

        service = new AudioLinkService(apiClient, new MockLogger());
    });

    it('should get the hearing by case number', async () => {
        const hearings = [
            new HearingsForAudioFileSearchResponse({ id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC4' }),
            new HearingsForAudioFileSearchResponse({ id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC5' }),
            new HearingsForAudioFileSearchResponse({ id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC6' })
        ];

        apiClient.searchForAudioRecordedHearings.and.returnValue(of(hearings));
        const result = await service.searchForHearingsByCaseNumberOrDate('case number', new Date());
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result.length).toBe(3);
    });

    it('should return null when getting the hearing by case number', async () => {
        apiClient.searchForAudioRecordedHearings.and.throwError('error');
        const result = await service.searchForHearingsByCaseNumberOrDate('case number', new Date());
        expect(result).toBeNull();
    });

    it('should get the audio link', async () => {
        const hearingAudioRecordingResponse = new HearingAudioRecordingResponse({ audio_file_links: ['someUrl'] });
        apiClient.getAudioRecordingLink.and.returnValue(of(hearingAudioRecordingResponse));
        const result = await service.getAudioLink('hearingId');
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result[0]).toBe(hearingAudioRecordingResponse.audio_file_links[0]);
    });
});
