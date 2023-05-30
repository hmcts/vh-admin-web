import { Injectable } from '@angular/core';
import { lastValueFrom, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { BHClient, CvpForAudioFileResponse, HearingAudioRecordingResponse, HearingsForAudioFileSearchResponse } from './clients/api-client';
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
            return await lastValueFrom(
                this.bhClient.searchForAudioRecordedHearings(caseNumber, date).pipe(this.toAudioRecordingResult(), take(1))
            );
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Error retrieving hearing for: ${caseNumber}`, error);
            return null;
        }
    }

    async getCvpAudioRecordings(cloudRoomName: string, date: string, caseReference: string): Promise<ICvpAudioRecordingResult> {
        if (cloudRoomName && date && caseReference) {
            return await lastValueFrom(
                this.bhClient.getCvpAudioRecordingsAll(cloudRoomName, date, caseReference).pipe(this.toAudioRecordingResult(), take(1))
            );
        } else if (cloudRoomName && date) {
            return await lastValueFrom(
                this.bhClient.getCvpAudioRecordingsByCloudRoom(cloudRoomName, date).pipe(this.toAudioRecordingResult(), take(1))
            );
        } else if (date) {
            return await lastValueFrom(
                this.bhClient.getCvpAudioRecordingsByDate(date, caseReference).pipe(this.toAudioRecordingResult(), take(1))
            );
        }

        throw InvalidParametersError({ cloudRoomName: cloudRoomName, date: date, caseReference: caseReference });
    }

    async getAudioLink(hearingId: string): Promise<HearingAudioRecordingResponse> {
        return await lastValueFrom(this.bhClient.getAudioRecordingLink(hearingId));
    }

    private toAudioRecordingResult() {
        return function (
            source: Observable<HearingsForAudioFileSearchResponse[] | CvpForAudioFileResponse[]>
        ): Observable<ICvpAudioRecordingResult | IVhAudioRecordingResult> {
            return new Observable<ICvpAudioRecordingResult | IVhAudioRecordingResult>(subscriber =>
                source.subscribe({
                    next(value) {
                        subscriber.next({ status: 200, result: value, error: null });
                    },
                    error(err) {
                        subscriber.next({ status: err?.status, result: null, error: err });
                    },
                    complete() {
                        subscriber.complete();
                    }
                })
            );
        };
    }
}
