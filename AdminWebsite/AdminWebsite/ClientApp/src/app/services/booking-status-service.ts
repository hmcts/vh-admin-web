import { Observable, timer } from 'rxjs';
import { VideoHearingsService } from './video-hearings.service';
import { UpdateBookingStatusResponse } from './clients/api-client';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class BookingStatusService {
    constructor(private readonly videoHearingService: VideoHearingsService) {}

    pollForStatus(hearingId: string): Observable<UpdateBookingStatusResponse> {
        const maxAttempts = 10;
        const interval = 5000;

        return new Observable<UpdateBookingStatusResponse>(subscriber => {
            const schedule = timer(0, interval).subscribe(async (counter: number) => {
                try {
                    const statusResponse = await this.videoHearingService.getStatus(hearingId);
                    if (statusResponse?.success || counter === maxAttempts) {
                        schedule.unsubscribe();
                        subscriber.next(statusResponse);
                        subscriber.complete();
                    }
                } catch (error) {
                    schedule.unsubscribe();
                    subscriber.error(error);
                }
            });
        });
    }
}
