import { fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { MockLogger } from '../shared/testing/mock-logger';
import { AudioLinkService, InvalidParametersError } from './audio-link-service';
import {
    BHClient,
    BookHearingException,
    CvpForAudioFileResponse,
    HearingAudioRecordingResponse,
    HearingsForAudioFileSearchResponse
} from './clients/api-client';

describe('AudioLinkService', () => {
    let apiClient: jasmine.SpyObj<BHClient>;
    let service: AudioLinkService;

    beforeEach(() => {
        apiClient = jasmine.createSpyObj<BHClient>('BHClient', [
            'searchForAudioRecordedHearings',
            'getAudioRecordingLink',
            'getCvpAudioRecordingsAll',
            'getCvpAudioRecordingsByCloudRoom',
            'getCvpAudioRecordingsByDate'
        ]);

        service = new AudioLinkService(apiClient, new MockLogger());
    });

    it('should return the correct IAudioRecordingResult when passed all and a 504 is thrown', async () => {
        // Arrange
        const cloudRoomName = 'cloud';
        const date = 'date';
        const caseReference = 'caseReference';
        const expectedStatus = 504;
        const expectedError = new BookHearingException('msg', expectedStatus, null, null, null);

        apiClient.getCvpAudioRecordingsAll.and.returnValue(<Observable<CvpForAudioFileResponse[]>>(<any>throwError(expectedError)));

        // Act
        const result = await service.getCvpAudioRecordings(cloudRoomName, date, caseReference);

        // Assert
        expect(result).toBeTruthy();
        expect(result.status).toBe(expectedStatus);
        expect(result.error).toEqual(expectedError);
        expect(result.result).toEqual(null);
    });

    it(`should return the correct IAudioRecordingResult when passed date and case reference and a 504 is thrown`, async () => {
        // Arrange
        const cloudRoomName = undefined;
        const date = 'date';
        const caseReference = 'caseReference';
        const expectedStatus = 504;
        const expectedError = new BookHearingException('msg', expectedStatus, null, null, null);

        apiClient.getCvpAudioRecordingsByDate.and.returnValue(<Observable<CvpForAudioFileResponse[]>>(<any>throwError(expectedError)));

        // Act
        const result = await service.getCvpAudioRecordings(cloudRoomName, date, caseReference);

        // Assert
        expect(result).toBeTruthy();
        expect(result.status).toBe(expectedStatus);
        expect(result.error).toEqual(expectedError);
        expect(result.result).toEqual(null);
    });

    it(`should return the correct IAudioRecordingResult when passed cloud room name and date and a 504 is thrown`, async () => {
        // Arrange
        const cloudRoomName = 'cloud';
        const date = 'date';
        const caseReference = undefined;
        const expectedStatus = 504;
        const expectedError = new BookHearingException('msg', expectedStatus, null, null, null);

        apiClient.getCvpAudioRecordingsByCloudRoom.and.returnValue(<Observable<CvpForAudioFileResponse[]>>(<any>throwError(expectedError)));

        // Act
        const result = await service.getCvpAudioRecordings(cloudRoomName, date, caseReference);

        // Assert
        expect(result).toBeTruthy();
        expect(result.status).toBe(expectedStatus);
        expect(result.error).toEqual(expectedError);
        expect(result.result).toEqual(null);
    });

    it(`should return the correct IAudioRecordingResult when an unknown error occurrs`, async () => {
        // Arrange
        const cloudRoomName = 'cloud';
        const date = 'date';
        const caseReference = undefined;
        const expectedStatus = 504;
        const expectedError = new Error('error');

        apiClient.getCvpAudioRecordingsByCloudRoom.and.returnValue(<Observable<CvpForAudioFileResponse[]>>(<any>throwError(expectedError)));

        // Act
        const result = await service.getCvpAudioRecordings(cloudRoomName, date, caseReference);

        // Assert
        expect(result).toBeTruthy();
        expect(result.status).toBe(undefined);
        expect(result.error).toEqual(expectedError);
        expect(result.result).toEqual(undefined);
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
        expect(result.result.length).toBe(3);
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
        const result = await service.getCvpAudioRecordings('cloud', 'date', 'caseReference');
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect((result.result as CvpForAudioFileResponse[]).length).toBe(2);
        expect((result.result[0] as CvpForAudioFileResponse).file_name).toBe('file1');
        expect((result.result[0] as CvpForAudioFileResponse).sas_token_uri).toBe('url1');
    });

    it('should get the cvp audio link by cloud room', async () => {
        const responses = [
            new CvpForAudioFileResponse({ file_name: 'file1', sas_token_uri: 'url1' }),
            new CvpForAudioFileResponse({ file_name: 'file2', sas_token_uri: 'url2' })
        ];

        apiClient.getCvpAudioRecordingsByCloudRoom.and.returnValue(of(responses));
        const result = await service.getCvpAudioRecordings('cloud', 'date', null);
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result.result.length).toBe(2);
        expect((result.result[0] as CvpForAudioFileResponse).file_name).toBe('file1');
        expect((result.result[0] as CvpForAudioFileResponse).sas_token_uri).toBe('url1');
    });

    it('should get the cvp audio link by date', async () => {
        const responses = [
            new CvpForAudioFileResponse({ file_name: 'file1', sas_token_uri: 'url1' }),
            new CvpForAudioFileResponse({ file_name: 'file2', sas_token_uri: 'url2' })
        ];

        apiClient.getCvpAudioRecordingsByDate.and.returnValue(of(responses));
        const result = await service.getCvpAudioRecordings(null, 'date', 'caseReference');
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result.result.length).toBe(2);
        expect((result.result[0] as CvpForAudioFileResponse).file_name).toBe('file1');
        expect((result.result[0] as CvpForAudioFileResponse).sas_token_uri).toBe('url1');
    });

    it('should throw an invaild parameters error if the date is not truthy', fakeAsync(async () => {
        // Arrange
        const cloudRoomName = 'a';
        const date = null;
        const caseReference = 'b';
        const errorParameters = { cloudRoomName: cloudRoomName, date: date, caseReference: caseReference };

        // Act & Assert
        try {
            await service.getCvpAudioRecordings(cloudRoomName, date, caseReference);
            flush();
        } catch (error) {
            expect(error).toEqual(InvalidParametersError(errorParameters));
            return;
        }

        throw Error('Expected exception');
    }));
});
