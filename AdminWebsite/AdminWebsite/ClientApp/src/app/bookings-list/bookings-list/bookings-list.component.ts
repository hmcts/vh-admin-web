import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom, Observable, Subject, Subscription } from 'rxjs';
import { Logger } from 'src/app/services/logger';
import { BookingsListModel } from '../../common/model/bookings-list.model';
import { BookingsModel } from '../../common/model/bookings.model';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { BookingsResponse } from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';
import moment from 'moment';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { JusticeUsersMenuComponent } from '../../shared/menus/justice-users-menu/justice-users-menu.component';
import { CaseTypesMenuComponent } from '../../shared/menus/case-types-menu/case-types-menu.component';
import { VenuesMenuComponent } from '../../shared/menus/venues-menu/venues-menu.component';
import { BookingsListItemModel } from 'src/app/common/model/booking-list-item.model';

@Component({
    selector: 'app-bookings-list',
    templateUrl: './bookings-list.component.html',
    styleUrls: ['./bookings-list.component.scss'],
    standalone: false
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
    searchForm: FormGroup;
    title = this.initialTitle;
    selectedVenueIds: [];
    selectedCaseTypes: string[];
    selectedUserIds: [];
    showSearch = false;
    today = new Date();

    destroyed$ = new Subject<void>();

    @ViewChild(JusticeUsersMenuComponent) csoMenu: JusticeUsersMenuComponent;
    @ViewChild(CaseTypesMenuComponent) caseTypeMenu: CaseTypesMenuComponent;
    @ViewChild(VenuesMenuComponent) venueMenu: VenuesMenuComponent;
    enableUser: boolean;

    constructor(
        private readonly bookingsListService: BookingsListService,
        private readonly bookingPersistService: BookingPersistService,
        private readonly videoHearingService: VideoHearingsService,
        private readonly formBuilder: FormBuilder,
        private readonly router: Router,
        private readonly logger: Logger,
        private readonly datePipe: DatePipe,
        private readonly returnUrlService: ReturnUrlService
    ) {}

    ngOnInit() {
        this.searchForm = this.initializeForm();
        this.showSearch = this.bookingPersistService.showSearch;
        this.logger.debug(`${this.loggerPrefix} Loading bookings list component`);
        if (this.bookingPersistService.bookingList.length > 0) {
            this.cursor = this.bookingPersistService.nextCursor;

            this.getEditedBookingFromStorage().then(editHearing => {
                // update item in the list by item from database
                const updatedBooking = this.bookingPersistService.updateBooking(editHearing);
                this.replaceBookingRecord(updatedBooking);

                // try to repeat for each of the hearings in group
                if (updatedBooking.Booking.hearingsInGroup && updatedBooking.Booking.hearingsInGroup.length > 0) {
                    updatedBooking.Booking.hearingsInGroup.forEach(updatedHearingInGroup => {
                        const listItemModel = this.bookingPersistService.bookingList
                            .flatMap(listItem => listItem.BookingsDetails)
                            .find(detail => detail.Booking.hearingId === updatedHearingInGroup.hearingId);

                        if (listItemModel) {
                            this.replaceBookingRecord(listItemModel);
                        }
                    });
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
            });
        } else {
            this.getList();
        }
    }

    async getEditedBookingFromStorage() {
        const selectedRecord =
            this.bookingPersistService.bookingList[this.bookingPersistService.selectedGroupIndex].BookingsDetails[
                this.bookingPersistService.selectedItemIndex
            ];
        this.logger.debug(`${this.loggerPrefix} Getting edited booking from storage`, { hearing: selectedRecord.Booking.hearingId });
        const response = await lastValueFrom(this.videoHearingService.getHearingById(selectedRecord.Booking.hearingId));
        this.logger.debug(`${this.loggerPrefix} Mapping hearing to edit hearing model`, { hearing: selectedRecord.Booking.hearingId });
        return this.videoHearingService.mapHearingDetailsResponseToHearingModel(response);
    }

    resetBookingIndex(booking: BookingsListItemModel) {
        this.logger.debug(`${this.loggerPrefix} Resseting the booking index`, { hearing: booking.Booking.hearingId });
        const dateOnly = new Date(booking.Booking.scheduledDateTime.valueOf());
        const dateNoTime = new Date(dateOnly.setHours(0, 0, 0, 0));
        this.selectedGroupIndex = this.bookings.findIndex(s => s.BookingsDate.toString() === dateNoTime.toString());
        if (this.selectedGroupIndex > -1) {
            this.selectedItemIndex = this.bookings[this.selectedGroupIndex].BookingsDetails.findIndex(
                x => x.Booking.hearingId === booking.Booking.hearingId
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

    get noJugdeInHearings(): boolean {
        return this.bookingPersistService.noJugdeInHearings;
    }

    private initializeForm(): FormGroup {
        return this.formBuilder.group({
            caseNumber: [this.bookingPersistService.caseNumber || null],
            selectedVenueIds: [this.bookingPersistService.selectedVenueIds || []],
            selectedUserIds: [this.bookingPersistService.selectedUsers || []],
            startDate: [this.formatDateToIsoString(this.bookingPersistService.startDate)],
            endDate: [this.formatDateToIsoString(this.bookingPersistService.endDate)],
            participantLastName: [this.bookingPersistService.participantLastName || null],
            noJudge: [this.bookingPersistService.noJugdeInHearings],
            noAllocated: [this.bookingPersistService.noAllocatedHearings]
        });
    }

    private loadBookingsList(): void {
        const self = this;
        this.loaded = this.error = false;
        const caseNumber = this.bookingPersistService.caseNumber || '';
        const venueIds = this.bookingPersistService.selectedVenueIds;
        const caseTypes = this.bookingPersistService.selectedCaseTypes;
        const users = this.bookingPersistService.selectedUsers;
        let startDate = this.bookingPersistService.startDate;
        let endDate = this.bookingPersistService.endDate;
        const lastName = this.bookingPersistService.participantLastName;
        const noJudge = this.bookingPersistService.noJugdeInHearings;
        const noAllocated = this.bookingPersistService.noAllocatedHearings;
        if (startDate) {
            startDate = moment(startDate).startOf('day').toDate();
        }
        if (endDate) {
            endDate = moment(endDate).endOf('day').toDate();
        }
        if (startDate && !endDate) {
            endDate = moment(startDate).endOf('day').toDate();
        }
        if (endDate && !startDate) {
            startDate = moment(endDate).startOf('day').toDate();
        }
        const bookingsList$: Observable<BookingsResponse> = this.bookingsListService.getBookingsList(
            this.cursor,
            this.limit,
            caseNumber,
            venueIds,
            caseTypes,
            users,
            startDate,
            endDate,
            lastName,
            noJudge,
            noAllocated
        );

        this.$subcription = bookingsList$.subscribe({
            next: book => self.loadData(book),
            error: err => self.handleListError(err, 'booking')
        });
    }

    onSearch(): void {
        if (this.searchForm.valid) {
            const caseNumber = this.searchForm.value['caseNumber'];
            const venueIds = this.bookingPersistService.selectedVenueIds;
            const selectedUserIds = this.bookingPersistService.selectedUsers;
            const startDate = this.searchForm.value['startDate'];
            const endDate = this.searchForm.value['endDate'];
            const lastName = this.searchForm.value['participantLastName'];
            const noJudge = this.searchForm.value['noJudge'];
            const noAllocated = this.searchForm.value['noAllocated'];
            this.bookingPersistService.caseNumber = caseNumber;
            this.bookingPersistService.selectedVenueIds = venueIds;
            this.bookingPersistService.startDate = startDate;
            this.bookingPersistService.endDate = endDate;
            this.bookingPersistService.participantLastName = lastName;
            this.bookingPersistService.noJugdeInHearings = noJudge ?? false;
            this.bookingPersistService.noAllocatedHearings = noAllocated || false;
            this.bookingPersistService.selectedUsers = selectedUserIds;
            this.cursor = undefined;
            this.clearSelectedRow();
            this.bookings = [];
            this.loadBookingsList();
            this.title = 'Search results';
        }
    }

    onClear(): void {
        this.searchForm.reset();
        const searchCriteriaEntered =
            this.bookingPersistService.caseNumber ||
            (this.bookingPersistService.selectedVenueIds && this.bookingPersistService.selectedVenueIds.length > 0) ||
            (this.bookingPersistService.selectedCaseTypes && this.bookingPersistService.selectedCaseTypes.length > 0) ||
            (this.bookingPersistService.selectedUsers && this.bookingPersistService.selectedUsers.length > 0) ||
            this.bookingPersistService.startDate ||
            this.bookingPersistService.endDate ||
            this.bookingPersistService.participantLastName ||
            this.bookingPersistService.noJugdeInHearings ||
            this.bookingPersistService.noAllocatedHearings;
        if (searchCriteriaEntered) {
            this.bookings = [];
            this.cursor = undefined;
            this.bookingPersistService.caseNumber = '';
            this.bookingPersistService.selectedVenueIds = [];
            this.venueMenu.clear();
            this.bookingPersistService.selectedCaseTypes = [];
            this.caseTypeMenu.clear();
            this.bookingPersistService.selectedUsers = [];
            this.csoMenu.clear();
            this.bookingPersistService.startDate = null;
            this.bookingPersistService.endDate = null;
            this.bookingPersistService.participantLastName = '';
            this.bookingPersistService.noJugdeInHearings = false;
            this.bookingPersistService.noAllocatedHearings = false;
            this.bookingPersistService.resetAll();
            this.loadBookingsList();
            this.title = this.initialTitle;
            this.searchForm.controls['selectedUserIds'].enable();
            this.searchForm.controls['noAllocated'].enable();
        }
    }

    private handleListError(err, type) {
        this.logger.error(`${this.loggerPrefix} Error getting ${type} list`, err, type);
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

    private replaceBookingRecord(booking: BookingsListItemModel) {
        if (booking.IsStartTimeChanged) {
            this.logger.debug(`${this.loggerPrefix} Start time has changed. Replacing booking record.`, {
                hearing: booking.Booking.hearingId
            });
            this.bookingsListService.replaceBookingRecord(booking, this.bookingPersistService.bookingList);
        }
    }

    scrollHandler() {
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
            this.selectedHearingId = this.bookings[groupByDate].BookingsDetails[indexHearing].Booking.hearingId;
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

    clearSelectedRow() {
        this.selectedHearingId = '';
        this.selectedGroupIndex = -1;
        this.selectedItemIndex = -1;
    }

    persistInformation() {
        this.logger.debug(`${this.loggerPrefix} Persisting booking information to session storage`, { hearing: this.selectedHearingId });
        this.bookingPersistService.bookingList = this.bookings;
        this.bookingPersistService.nextCursor = this.cursor;
        this.bookingPersistService.selectedGroupIndex = this.selectedGroupIndex;
        this.bookingPersistService.selectedItemIndex = this.selectedItemIndex;
        // hearing id is stored in session storage
        this.bookingPersistService.selectedHearingId = this.selectedHearingId;
        this.returnUrlService.setUrl(`${PageUrls.BookingsList}`);
        this.bookingPersistService.showSearch = this.showSearch;
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

    openSearchPanel() {
        this.showSearch = true;
    }

    closeSearchPanel() {
        this.showSearch = false;
        this.onClear();
    }

    onStartDateBlur() {
        if (this.isStartDateAfterEndDate() || this.isStartDateInPast()) {
            this.searchForm.controls['startDate'].setValue(null);
        }
    }

    onEndDateBlur() {
        if (this.isStartDateAfterEndDate() || this.isEndDateInPast()) {
            this.searchForm.controls['endDate'].setValue(null);
        }
    }

    isStartDateAfterEndDate() {
        const startDate = this.searchForm.value.startDate ? moment(this.searchForm.value.startDate).startOf('day').toDate() : null;
        const endDate = this.searchForm.value.endDate ? moment(this.searchForm.value.endDate).startOf('day').toDate() : null;

        if (!startDate || !endDate) {
            return false;
        }

        return startDate > endDate;
    }

    isStartDateInPast() {
        const startDate = this.searchForm.value.startDate ? moment(this.searchForm.value.startDate).startOf('day').toDate() : null;

        if (!startDate) {
            return false;
        }

        const todayDate = moment().startOf('day').toDate();

        return startDate < todayDate;
    }

    isEndDateInPast() {
        const endDate = this.searchForm.value.endDate ? moment(this.searchForm.value.endDate).startOf('day').toDate() : null;

        if (!endDate) {
            return false;
        }

        const todayDate = moment().startOf('day').toDate();

        return endDate < todayDate;
    }

    formatDateToIsoString(date?: Date) {
        if (!date) {
            return null;
        }

        return this.datePipe.transform(date, 'yyyy-MM-dd');
    }

    ngOnDestroy() {
        this.$subcription?.unsubscribe();
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    selectedUsersEmitter($event: string[]) {
        this.bookingPersistService.selectedUsers = $event;
        this.onSelectUserChange();
    }

    onSelectUserChange() {
        const selectedUserIds = this.bookingPersistService.selectedUsers;
        if (selectedUserIds.length > 0) {
            this.searchForm.controls['noAllocated'].disable();
            this.bookingPersistService.noAllocatedHearings = false;
        } else {
            this.searchForm.controls['noAllocated'].enable();
        }
    }

    onChangeNoAllocated() {
        const noAllocated = this.searchForm.value['noAllocated'];
        if (noAllocated) {
            this.enableUser = false;
            this.bookingPersistService.selectedUsers = [];
        } else {
            this.enableUser = true;
        }
    }

    selectedCaseTypesEmitter($event: string[]) {
        this.bookingPersistService.selectedCaseTypes = $event;
    }

    selectedVenueEmitter($event: number[]) {
        this.bookingPersistService.selectedVenueIds = $event;
    }
}
