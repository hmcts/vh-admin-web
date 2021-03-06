import { Router } from '@angular/router';
import { ParticipantHearingDeleteResultModel } from 'src/app/common/model/participant-hearing-delete-result-model';
import { BookingPersistService } from 'src/app/services/bookings-persist.service';
import { HearingsByUsernameForDeletionResponse } from 'src/app/services/clients/api-client';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { DeleteParticipantSearchResultsComponent } from './delete-participant-search-results.component';
import { ParticipantDeleteService } from 'src/app/services/participant-delete-service.service';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { Logger } from 'src/app/services/logger';

describe('DeleteParticipantSearchResultsComponent', () => {
    let component: DeleteParticipantSearchResultsComponent;
    let bookingPersistService: jasmine.SpyObj<BookingPersistService>;
    let videoHearingService: jasmine.SpyObj<VideoHearingsService>;
    let participantDeleteService: jasmine.SpyObj<ParticipantDeleteService>;
    let router: jasmine.SpyObj<Router>;
    let returnUrlService: jasmine.SpyObj<ReturnUrlService>;
    const logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'error']);

    beforeAll(() => {
        bookingPersistService = jasmine.createSpyObj<BookingPersistService>('BookingPersistService', ['selectedHearingId']);
        videoHearingService = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', ['cancelRequest']);
        participantDeleteService = jasmine.createSpyObj<ParticipantDeleteService>('ParticipantDeleteService', ['deleteUserAccount']);
        router = jasmine.createSpyObj<Router>(['navigate']);
        returnUrlService = jasmine.createSpyObj<ReturnUrlService>('ReturnUrlService', ['popUrl', 'setUrl']);
    });

    beforeEach(() => {
        component = new DeleteParticipantSearchResultsComponent(
            bookingPersistService,
            videoHearingService,
            participantDeleteService,
            router,
            returnUrlService,
            logger
        );
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
        expect(component.existsWithHearings).toBeTruthy();
        expect(component.existsWithoutHearings).toBeFalsy();
        expect(component.userNotFound).toBeFalsy();
    });

    it('should return false when results list is empty', () => {
        component.results = [];
        expect(component.existsWithoutHearings).toBeTruthy();
        expect(component.existsWithHearings).toBeFalsy();
        expect(component.userNotFound).toBeFalsy();
    });

    it('should return userNotFound true when results is null ', () => {
        component.results = null;
        expect(component.existsWithoutHearings).toBeFalsy();
        expect(component.existsWithHearings).toBeFalsy();
        expect(component.userNotFound).toBeTruthy();
    });

    it('should navigate to booking details for edit', () => {
        component.username = 'test@hmcts.net';
        component.editHearing('1234');
        expect(videoHearingService.cancelRequest).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.BookingDetails]);
        expect(returnUrlService.setUrl).toHaveBeenCalledWith(`${PageUrls.DeleteParticipant}?username=${component.username}`);
    });

    it('should display confirm delete popup', () => {
        component.displayConfirmPopup = false;
        component.displayConfirmDeleteDialog();
        expect(component.displayConfirmPopup).toBeTruthy();
    });

    it('should delete account on confirm', async () => {
        participantDeleteService.deleteUserAccount.calls.reset();
        component.displayConfirmPopup = true;
        await component.onDeletionAnswer(true);
        expect(component.displayConfirmPopup).toBeFalsy();
        expect(participantDeleteService.deleteUserAccount).toHaveBeenCalledTimes(1);
        expect(component.accountDeleted).toBe(true);
    });

    it('should not delete account on cancel', async () => {
        participantDeleteService.deleteUserAccount.calls.reset();
        component.displayConfirmPopup = true;
        await component.onDeletionAnswer(false);
        expect(component.displayConfirmPopup).toBeFalsy();
        expect(component.accountDeleted).toBeFalsy();
        expect(participantDeleteService.deleteUserAccount).toHaveBeenCalledTimes(0);
    });

    it('should not display account delete on error', async () => {
        const error = { status: 401, isApiException: true };
        participantDeleteService.deleteUserAccount.and.returnValue(Promise.reject(error));
        component.displayConfirmPopup = true;
        await component.onDeletionAnswer(true);
        expect(component.displayConfirmPopup).toBeFalsy();
        expect(component.accountDeleted).toBeFalsy();
    });
});
