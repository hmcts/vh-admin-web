import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Logger } from 'src/app/services/logger';
import { BookingsDetailsModel, BookingsListModel } from '../../common/model/bookings-list.model';
import { BookingsModel } from '../../common/model/bookings.model';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { BookingsResponse } from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';

@Component({
    selector: 'app-bookings-list',
    templateUrl: './bookings-list.component.html',
    styleUrls: ['./bookings-list.component.css']
})
export class BookingsListComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[BookingsList] -';
    bookings: Array<BookingsListModel> = [];
    loaded = false;
    error = false;
    cursor = '0';
    limit = 100;
    endOfData = false;
    recordsLoaded = false;

    selectedItemIndex = -1;
    selectedGroupIndex = -1;
    selectedElement: HTMLElement;
    selectedHearingId = '';
    bookingResponse: BookingsModel;
    $subcription: Subscription;

    constructor(
        private bookingsListService: BookingsListService,
        private bookingPersistService: BookingPersistService,
        private videoHearingService: VideoHearingsService,
        private router: Router,
        private logger: Logger,
        @Inject(DOCUMENT) document
    ) {}

    async ngOnInit() {
        this.logger.debug(`${this.loggerPrefix} Loading bookings list component`);
        if (this.bookingPersistService.bookingList.length > 0) {
            this.cursor = this.bookingPersistService.nextCursor;

            const editHearing = await this.getEditedBookingFromStorage();

            // update item in the list by item from database
            const updatedBooking = this.bookingPersistService.updateBooking(editHearing);

            if (updatedBooking.IsStartTimeChanged) {
                this.logger.debug(`${this.loggerPrefix} Start time has changed. Replacing booking record.`, {
                    hearing: updatedBooking.HearingId
                });
                this.bookingsListService.replaceBookingRecord(updatedBooking, this.bookingPersistService.bookingList);
            }

            this.logger.debug(`${this.loggerPrefix} Clearing request from session storage`);
            this.videoHearingService.cancelRequest();
            Object.assign(this.bookings, this.bookingPersistService.bookingList);
            this.loaded = true;
            this.recordsLoaded = true;
            setTimeout(() => {
                this.unselectRows(this.bookingPersistService.selectedGroupIndex, this.bookingPersistService.selectedItemIndex);
                this.bookingPersistService.resetAll();
                this.resetBookingIndex(updatedBooking);

                this.closeHearingDetails();
            }, 500);
        } else {
            this.getList();
        }
    }

    async getEditedBookingFromStorage() {
        const selectedRecord = this.bookingPersistService.bookingList[this.bookingPersistService.selectedGroupIndex].BookingsDetails[
            this.bookingPersistService.selectedItemIndex
        ];
        this.logger.debug(`${this.loggerPrefix} Getting edited booking from storage`, { hearing: selectedRecord.HearingId });
        const response = await this.videoHearingService.getHearingById(selectedRecord.HearingId).toPromise();
        this.logger.debug(`${this.loggerPrefix} Mapping hearing to edit hearing model`, { hearing: selectedRecord.HearingId });
        const editHearing = this.videoHearingService.mapHearingDetailsResponseToHearingModel(response);
        return editHearing;
    }

    resetBookingIndex(booking: BookingsDetailsModel) {
        this.logger.debug(`${this.loggerPrefix} Resseting the booking index`, { hearing: booking.HearingId });
        const dateOnly = new Date(booking.StartTime.valueOf());
        const dateNoTime = new Date(dateOnly.setHours(0, 0, 0, 0));
        this.selectedGroupIndex = this.bookings.findIndex(s => s.BookingsDate.toString() === dateNoTime.toString());
        if (this.selectedGroupIndex > -1) {
            this.selectedItemIndex = this.bookings[this.selectedGroupIndex].BookingsDetails.findIndex(
                x => x.HearingId === booking.HearingId
            );
        } else {
            this.selectedItemIndex = -1;
        }
    }

    getList() {
        if (!this.endOfData) {
            this.logger.debug(`${this.loggerPrefix} More data available, retrieving next set of hearings`, {
                cursor: this.cursor,
                limit: this.limit
            });
            const self = this;
            this.loaded = false;
            this.error = false;
            this.$subcription = this.bookingsListService.getBookingsList(this.cursor, this.limit).subscribe(
                book => self.loadData(book),
                err => self.handleError(err)
            );
        }
    }

    private handleError(err) {
        this.logger.error(`${this.loggerPrefix} Error getting booking list`, err);
        this.error = true;
    }

    private loadData(bookingsResponse: BookingsResponse) {
        this.logger.debug(`${this.loggerPrefix} Displaying next batch of bookings`, {
            hearingsCount: bookingsResponse.hearings.length,
            nextCursor: bookingsResponse.next_cursor,
            limit: bookingsResponse.limit
        });
        // we get new portion of data
        if (!bookingsResponse) {
            this.error = true;
            return;
        }
        const bookingsModel = this.bookingsListService.mapBookingsResponse(bookingsResponse);
        if (!bookingsModel.NextCursor && bookingsModel.Hearings.length === 0) {
            this.endOfData = true;
            return;
        }
        this.cursor = bookingsModel.NextCursor;

        if (bookingsModel.Hearings) {
            // append a new portion of data to list
            this.bookings = this.bookingsListService.addBookings(bookingsModel, this.bookings);
        }
        this.bookingResponse = bookingsModel;
        this.recordsLoaded = true;
        this.loaded = true;
    }

    scrollHandler(e) {
        this.getList();
    }

    rowSelected(groupByDate, indexHearing) {
        this.logger.debug(`${this.loggerPrefix} Selected row`, {
            groupByDate,
            indexHearing
        });
        this.setSelectedRow(groupByDate, indexHearing);
        this.videoHearingService.cancelRequest();
        this.persistInformation();
        this.router.navigate([PageUrls.BookingDetails]);
    }

    setSelectedRow(groupByDate, indexHearing) {
        if (this.selectedGroupIndex > -1 && this.selectedItemIndex > -1) {
            this.bookings[this.selectedGroupIndex].BookingsDetails[this.selectedItemIndex].Selected = false;
        }
        if (
            groupByDate > -1 &&
            indexHearing > -1 &&
            groupByDate < this.bookings.length &&
            indexHearing < this.bookings[groupByDate].BookingsDetails.length
        ) {
            this.bookings[groupByDate].BookingsDetails[indexHearing].Selected = true;
            this.selectedHearingId = this.bookings[groupByDate].BookingsDetails[indexHearing].HearingId;
            this.selectedGroupIndex = groupByDate;
            this.selectedItemIndex = indexHearing;
        }
    }

    unselectRows(groupByDate, indexHearing) {
        if (groupByDate > -1 && indexHearing > -1) {
            this.logger.debug(`${this.loggerPrefix} Unselecting rows`, { groupByDate, indexHearing });
            this.bookings[groupByDate].BookingsDetails[indexHearing].Selected = false;
        }
    }

    persistInformation() {
        this.logger.debug(`${this.loggerPrefix} Persisting booking information to session storage`, { hearing: this.selectedHearingId });
        this.bookingPersistService.bookingList = this.bookings;
        this.bookingPersistService.nextCursor = this.cursor;
        this.bookingPersistService.selectedGroupIndex = this.selectedGroupIndex;
        this.bookingPersistService.selectedItemIndex = this.selectedItemIndex;
        // hearing id is stored in session storage
        this.bookingPersistService.selectedHearingId = this.selectedHearingId;
    }

    closeHearingDetails() {
        this.logger.info(`${this.loggerPrefix} Closing hearing details`);
        setTimeout(() => {
            this.selectedElement = document.getElementById(this.selectedGroupIndex + '_' + this.selectedItemIndex);
            if (this.selectedElement) {
                this.selectedElement.scrollIntoView(false);
            }
        }, 500);
    }

    ngOnDestroy() {
        if (this.$subcription) {
            this.$subcription.unsubscribe();
        }
    }
}
