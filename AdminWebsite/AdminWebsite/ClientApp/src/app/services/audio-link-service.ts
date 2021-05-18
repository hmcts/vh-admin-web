import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, observeOn, take } from 'rxjs/operators';
import { BHClient, BookHearingException, CvpForAudioFileResponse, HearingsForAudioFileSearchResponse } from './clients/api-client';
import { Logger } from './logger';

export const InvalidParametersError = (parameters: { [parameterName: string]: any }) =>
    new Error(`Invlalid parameter combiniation ${JSON.stringify(parameters)}.`);

export interface ICvpAudioRecordingResult {
    status: number;
    result: CvpForAudioFileResponse[];
    error: any;
}

export interface IVhAudioRecordingResult {
    status: number;
    result: HearingsForAudioFileSearchResponse[];
    error: any;
}

@Injectable({ providedIn: 'root' })
export class AudioLinkService {
    private readonly loggerPrefix = '[AudioLinkService] -';
    constructor(private bhClient: BHClient, private logger: Logger) {}

    async searchForHearingsByCaseNumberOrDate(caseNumber: string, date?: Date): Promise<IVhAudioRecordingResult> {
        try {
            return await this.bhClient
                .searchForAudioRecordedHearings(caseNumber, date)
                .pipe(this.toAudioRecordingResult(), take(1))
                .toPromise();
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Error retrieving hearing for: ${caseNumber}`, error);
            return null;
        }
    }

    async getCvpAudioRecordings(cloudRoomName: string, date: string, caseReference: string): Promise<ICvpAudioRecordingResult> {
        if (cloudRoomName && date && caseReference) {
            return await this.bhClient
                .getCvpAudioRecordingsAll(cloudRoomName, date, caseReference)
                .pipe(this.toAudioRecordingResult(), take(1))
                .toPromise();
        } else if (cloudRoomName && date) {
            return await this.bhClient
                .getCvpAudioRecordingsByCloudRoom(cloudRoomName, date)
                .pipe(this.toAudioRecordingResult(), take(1))
                .toPromise();
        } else if (date) {
            return await this.bhClient
                .getCvpAudioRecordingsByDate(date, caseReference)
                .pipe(this.toAudioRecordingResult(), take(1))
                .toPromise();
        }

        throw InvalidParametersError({ cloudRoomName: cloudRoomName, date: date, caseReference: caseReference });
    }

    async getAudioLink(hearingId: string): Promise<string[]> {
        const response = await this.bhClient.getAudioRecordingLink(hearingId).toPromise();
        return response.audio_file_links;
    }

    private toAudioRecordingResult() {
        return function (
            source: Observable<HearingsForAudioFileSearchResponse[] | CvpForAudioFileResponse[]>
        ): Observable<ICvpAudioRecordingResult | IVhAudioRecordingResult> {
            return new Observable<ICvpAudioRecordingResult | IVhAudioRecordingResult>(subscriber => {
                return source.subscribe({
                    next(value) {
                        subscriber.next({ status: 200, result: value, error: null });
                    },
                    error(err) {
                        subscriber.next({ status: err?.status, result: null, error: err });
                    },
                    complete() {
                        subscriber.complete();
                    }
                });
            });
        };
    }
}
