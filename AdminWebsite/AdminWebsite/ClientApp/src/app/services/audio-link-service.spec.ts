import { of } from 'rxjs';
import { MockLogger } from '../shared/testing/mock-logger';
import { AudioLinkService } from './audio-link-service';
import { BHClient, CvpForAudioFileResponse, HearingAudioRecordingResponse, HearingsForAudioFileSearchResponse } from './clients/api-client';

describe('AudioLinkService', () => {
    let apiClient: jasmine.SpyObj<BHClient>;
    let service: AudioLinkService;

    beforeAll(() => {
        apiClient = jasmine.createSpyObj<BHClient>('BHClient', [
            'searchForAudioRecordedHearings',
            'getAudioRecordingLink',
            'getCvpAudioRecordingsAll',
            'getCvpAudioRecordingsByCloudRoom',
            'getCvpAudioRecordingsByDate'
        ]);

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

    it('should get the cvp audio link for all parameters', async () => {
        const responses = [
            new CvpForAudioFileResponse({ file_name: 'file1', sas_token_uri: 'url1' }),
            new CvpForAudioFileResponse({ file_name: 'file2', sas_token_uri: 'url2' })
        ];

        apiClient.getCvpAudioRecordingsAll.and.returnValue(of(responses));
        const result = await service.getCvpAudioRecordingsAll('cloud', 'date', 'caseReference');
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result.length).toBe(2);
        expect(result[0].file_name).toBe('file1');
        expect(result[0].sas_token_uri).toBe('url1');
    });

    it('should get the cvp audio link by cloud room', async () => {
        const responses = [
            new CvpForAudioFileResponse({ file_name: 'file1', sas_token_uri: 'url1' }),
            new CvpForAudioFileResponse({ file_name: 'file2', sas_token_uri: 'url2' })
        ];

        apiClient.getCvpAudioRecordingsByCloudRoom.and.returnValue(of(responses));
        const result = await service.getCvpAudioRecordingsByCloudRoom('cloud', 'date');
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result.length).toBe(2);
        expect(result[0].file_name).toBe('file1');
        expect(result[0].sas_token_uri).toBe('url1');
    });

    it('should get the cvp audio link by date', async () => {
        const responses = [
            new CvpForAudioFileResponse({ file_name: 'file1', sas_token_uri: 'url1' }),
            new CvpForAudioFileResponse({ file_name: 'file2', sas_token_uri: 'url2' })
        ];

        apiClient.getCvpAudioRecordingsByDate.and.returnValue(of(responses));
        const result = await service.getCvpAudioRecordingsByDate('date', 'caseReference');
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result.length).toBe(2);
        expect(result[0].file_name).toBe('file1');
        expect(result[0].sas_token_uri).toBe('url1');
    });
});
