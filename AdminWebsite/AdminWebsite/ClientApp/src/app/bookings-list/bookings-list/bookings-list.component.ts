import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Logger } from 'src/app/services/logger';
import { BookingsDetailsModel, BookingsListModel } from '../../common/model/bookings-list.model';
import { BookingsModel } from '../../common/model/bookings.model';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { BookingsResponse, HearingVenueResponse } from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { FeatureFlags, LaunchDarklyService } from '../../services/launch-darkly.service';
import { PageUrls } from '../../shared/page-url.constants';
import { ReferenceDataService } from 'src/app/services/reference-data.service';

@Component({
    selector: 'app-bookings-list',
    templateUrl: './bookings-list.component.html',
    styleUrls: ['./bookings-list.component.css']
})
export class BookingsListComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[BookingsList] -';
    private readonly initialTitle = 'Booking List';
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
    $ldSubcription: Subscription;
    searchForm: FormGroup;
    enableSearchFeature = true; // temporary
    title = this.initialTitle;
    venues: HearingVenueResponse[];
    selectedVenueIds: [];
    showSearch = this.enableSearchFeature; // temporary // showSearch: boolean;

    constructor(
        private bookingsListService: BookingsListService,
        private bookingPersistService: BookingPersistService,
        private videoHearingService: VideoHearingsService,
        private formBuilder: FormBuilder,
        private lanchDarklyService: LaunchDarklyService,
        private router: Router,
        private logger: Logger,
        private refDataService: ReferenceDataService,
        @Inject(DOCUMENT) document
    ) {
        this.$ldSubcription = this.lanchDarklyService.flagChange.subscribe(value => {
            if (value) {
                this.enableSearchFeature = value[FeatureFlags.adminSearch];
                console.log('Feature toggle is', this.enableSearchFeature);
                this.showSearch = this.enableSearchFeature;
            }
        });
    }

    async ngOnInit() {
        this.searchForm = this.initializeForm();

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
            this.unselectRows(this.bookingPersistService.selectedGroupIndex, this.bookingPersistService.selectedItemIndex);
            this.bookingPersistService.resetAll();
            this.resetBookingIndex(updatedBooking);

            this.closeHearingDetails();
        } else {
            this.getList();
            this.loadVenuesList();
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
            this.loadBookingsList();
        }
    }

    private initializeForm(): FormGroup {
        // TODO need to reinstate validation here - one item from this group should be required for the search button to be enabled
        return this.formBuilder.group({
            caseNumber: [this.bookingPersistService.searchTerm || null],
            selectedVenueIds: [this.bookingPersistService.selectedVenueIds || []]
        });
    }

    private loadBookingsList(): void {
        const self = this;
        this.loaded = this.error = false;
        const searchTerm = this.bookingPersistService.searchTerm || '';
        const venueIds = this.bookingPersistService.selectedVenueIds;
        let bookingsList$: Observable<BookingsResponse>;

        if (this.enableSearchFeature) {
            // new feature
            bookingsList$ = this.bookingsListService.getBookingsList(this.cursor, this.limit, searchTerm, venueIds);
        } else {
            // previous implementation
            bookingsList$ = this.bookingsListService.getBookingsList(this.cursor, this.limit);
        }

        this.$subcription = bookingsList$.subscribe(
            book => {
                self.loadData(book);
            },
            err => self.handleLoadBookingsListError(err)
        );
    }

    onSearch(): void {
        if (this.searchForm.valid) {
            const caseNumber = this.searchForm.value['caseNumber'];
            const venueIds = this.searchForm.value['selectedVenueIds'];
            this.bookingPersistService.searchTerm = caseNumber;
            this.bookingPersistService.selectedVenueIds = venueIds;
            this.cursor = undefined;
            this.bookings = [];
            this.loadBookingsList();
            this.title = 'Search results';
        }
    }

    onClear(): void {
        this.searchForm.reset();
        const searchCriteriaEntered =
            this.bookingPersistService.searchTerm ||
            (this.bookingPersistService.selectedVenueIds && this.bookingPersistService.selectedVenueIds.length > 0);
        if (searchCriteriaEntered) {
            this.bookings = [];
            this.cursor = undefined;
            this.bookingPersistService.searchTerm = '';
            this.bookingPersistService.selectedVenueIds = [];
            this.bookingPersistService.resetAll();
            this.loadBookingsList();
            this.title = this.initialTitle;
        }
    }

    private handleLoadBookingsListError(err) {
        this.logger.error(`${this.loggerPrefix} Error getting booking list`, err);
        this.error = true;
    }

    private handleLoadVenuesListError(err) {
        this.logger.error(`${this.loggerPrefix} Error getting venue list`, err);
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
        this.logger.debug(`${this.loggerPrefix} Closing hearing details`);
        setTimeout(() => {
            this.selectedElement = document.getElementById(this.selectedGroupIndex + '_' + this.selectedItemIndex);
            if (this.selectedElement) {
                this.selectedElement.scrollIntoView(false);
            }
        }, 500);
    }

    private loadVenuesList(): void {
        const self = this;

        this.refDataService.getCourts().subscribe(
            (data: HearingVenueResponse[]) => {
                this.venues = data;
                this.logger.debug(`${this.loggerPrefix} Updating list of venues.`, { venues: data.length });
            },
            error => self.handleLoadVenuesListError(error)
        );
    }

    isSearchFormValid() {
        const caseNumber = this.searchForm.controls.caseNumber.value as String;
        const venueIds = this.searchForm.controls.selectedVenueIds.value as Array<number>;

        if (caseNumber || (venueIds && venueIds.length > 0)) {
            return true;
        }

        return false;
    }

    openSearchPanel() {
        this.showSearch = true;
    }

    closeSearchPanel() {
        this.showSearch = false;
        this.onClear();
    }

    ngOnDestroy() {
        this.$subcription?.unsubscribe();
        this.$ldSubcription?.unsubscribe();
    }
}
