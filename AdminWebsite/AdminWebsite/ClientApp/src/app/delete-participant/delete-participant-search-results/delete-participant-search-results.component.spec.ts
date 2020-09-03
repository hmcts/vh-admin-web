import { Router } from '@angular/router';
import { ParticipantHearingDeleteResultModel } from 'src/app/common/model/participant-hearing-delete-result-model';
import { BookingPersistService } from 'src/app/services/bookings-persist.service';
import { HearingsByUsernameForDeletionResponse } from 'src/app/services/clients/api-client';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { DeleteParticipantSearchResultsComponent } from './delete-participant-search-results.component';

describe('DeleteParticipantSearchResultsComponent', () => {
    let component: DeleteParticipantSearchResultsComponent;
    let bookingPersistService: jasmine.SpyObj<BookingPersistService>;
    let videoHearingService: jasmine.SpyObj<VideoHearingsService>;
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        bookingPersistService = jasmine.createSpyObj<BookingPersistService>('BookingPersistService', ['selectedHearingId']);
        videoHearingService = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', ['cancelRequest']);
        router = jasmine.createSpyObj<Router>(['navigate']);
    });

    beforeEach(() => {
        component = new DeleteParticipantSearchResultsComponent(bookingPersistService, videoHearingService, router);
    });

    it('should return true when results list is greater than 0', () => {
        const hearings = [
            new HearingsByUsernameForDeletionResponse({
                case_name: 'case1',
                case_number: '123',
                scheduled_date_time: new Date(),
                venue: 'venue1'
            })
        ];
        const searchResults = [new ParticipantHearingDeleteResultModel(hearings[0])];

        component.results = searchResults;
        expect(component.hasResults).toBeTruthy();
    });

    it('should return false when results list is empty', () => {
        component.results = [];
        expect(component.hasResults).toBeFalsy();
    });

    it('should return userNotFound true when results is null ', () => {
        component.results = null;
        expect(component.userNotFound).toBeTruthy();
    });

    it('should return userNotFound false when results is set ', () => {
        component.results = [];
        expect(component.userNotFound).toBeTruthy();
    });

    it('should navigate to booking details for edit', () => {
        component.editHearing('1234');
        expect(videoHearingService.cancelRequest).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.BookingDetails]);
    });
});
