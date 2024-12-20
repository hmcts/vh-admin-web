import { Injectable } from '@angular/core';
import { BookingsListModel } from '../common/model/bookings-list.model';
import { VHBooking } from '../common/model/vh-booking';
import { BookingsListItemModel } from '../common/model/booking-list-item.model';

@Injectable({ providedIn: 'root' })
export class BookingPersistService {
    private _bookingList: Array<BookingsListModel> = [];
    private _nextCursor: string;
    private _selectedGroupIndex: number;
    private _selectedItemIndex: number;
    private _caseNumber: string;
    private _selectedVenueIds: number[] = [];
    private _selectedCaseTypes: string[] = [];
    private _selectedUsers: string[] = [];
    private _startDate: Date;
    private _endDate: Date;
    private _participantLastName: string;
    private _noJudgeInHearings: boolean;
    private _noAllocatedHearings: boolean;
    private _showSearch = false;
    private readonly SelectedHearingIdKey = 'SelectedHearingIdKey';

    resetAll() {
        this._bookingList = [];
        this._nextCursor = undefined;
        this.selectedGroupIndex = -1;
        this.selectedItemIndex = -1;
        sessionStorage.removeItem(this.SelectedHearingIdKey);
    }

    updateBooking(hearing: VHBooking): BookingsListItemModel {
        if (
            this._bookingList.length > this._selectedGroupIndex &&
            this._bookingList[this._selectedGroupIndex].BookingsDetails.length > this._selectedItemIndex
        ) {
            const hearingUpdate = this._bookingList[this._selectedGroupIndex].BookingsDetails[this.selectedItemIndex];
            if (hearingUpdate.Booking.hearingId === hearing.hearingId) {
                this.updateBookingRecord(hearingUpdate, hearing);

                if (hearingUpdate.Booking.isMultiDay) {
                    this.updateHearingsInGroup(hearingUpdate, hearing);
                }
                return hearingUpdate;
            }
        }
    }

    private updateBookingRecord(hearingUpdate: BookingsListItemModel, hearing: VHBooking) {
        const newStartDate = new Date(hearing.scheduledDateTime);

        hearingUpdate.IsStartTimeChanged = hearingUpdate.Booking.scheduledDateTime.toString() !== newStartDate.toString();
        hearingUpdate.Selected = true;
        hearingUpdate.Booking = hearing;

        return hearingUpdate;
    }

    private updateHearingsInGroup(hearingUpdate: BookingsListItemModel, hearing: VHBooking) {
        const hearingsInGroupUpdate: BookingsListItemModel[] = this._bookingList.flatMap(booking =>
            booking.BookingsDetails.filter(
                bookingDetail =>
                    bookingDetail.Booking.groupId === hearingUpdate.Booking.groupId && bookingDetail.Booking.hearingId !== hearing.hearingId
            )
        );

        if (hearingsInGroupUpdate) {
            hearingsInGroupUpdate.forEach(hearingInGroupToUpdate => {
                const hearingInGroup = hearing.hearingsInGroup.find(x => x.hearingId === hearingInGroupToUpdate.Booking.hearingId);
                this.updateBookingRecord(hearingInGroupToUpdate, hearingInGroup);
            });
        }

        hearingUpdate.Booking.hearingsInGroup = hearingsInGroupUpdate.flatMap(x => x.Booking);
    }

    isValidDate(value: any): boolean {
        if (value) {
            const timestamp = Date.parse(value.toString());
            return isNaN(timestamp) === false;
        }
        return false;
    }

    getJudgeName(hearing: VHBooking) {
        if (hearing.judiciaryParticipants && hearing.judiciaryParticipants.length > 0) {
            const judiciaryJudge = hearing.judiciaryParticipants.find(x => x.roleCode === 'Judge');
            return judiciaryJudge ? judiciaryJudge.displayName : '';
        }

        const judge = hearing.participants.find(x => x.isJudge);
        return judge ? judge.display_Name : '';
    }

    set bookingList(value: Array<BookingsListModel>) {
        this._bookingList = value;
    }

    get bookingList(): Array<BookingsListModel> {
        return this._bookingList;
    }

    set nextCursor(value: string) {
        this._nextCursor = value;
    }

    get nextCursor(): string {
        return this._nextCursor;
    }

    get caseNumber(): string {
        return this._caseNumber;
    }

    set caseNumber(value) {
        this._caseNumber = value;
    }

    get participantLastName(): string {
        return this._participantLastName;
    }

    set participantLastName(value) {
        this._participantLastName = value;
    }

    get noJugdeInHearings(): boolean {
        return this._noJudgeInHearings;
    }

    set noJugdeInHearings(value) {
        this._noJudgeInHearings = value;
    }

    get noAllocatedHearings(): boolean {
        return this._noAllocatedHearings;
    }

    set noAllocatedHearings(value) {
        this._noAllocatedHearings = value;
    }

    get selectedVenueIds(): number[] {
        return this._selectedVenueIds;
    }

    set selectedVenueIds(value) {
        this._selectedVenueIds = value;
    }

    get selectedCaseTypes(): string[] {
        return this._selectedCaseTypes;
    }

    set selectedCaseTypes(value) {
        this._selectedCaseTypes = value;
    }

    get selectedUsers(): string[] {
        return this._selectedUsers;
    }

    set selectedUsers(value) {
        this._selectedUsers = value;
    }

    get startDate(): Date {
        return this._startDate;
    }

    set startDate(value) {
        this._startDate = value ? new Date(value) : null;
    }

    get endDate(): Date {
        return this._endDate;
    }

    set endDate(value) {
        this._endDate = value ? new Date(value) : null;
    }

    set selectedGroupIndex(value: number) {
        this._selectedGroupIndex = value;
    }

    get selectedGroupIndex() {
        return this._selectedGroupIndex;
    }

    set selectedItemIndex(value: number) {
        this._selectedItemIndex = value;
    }

    get selectedItemIndex() {
        return this._selectedItemIndex;
    }

    set selectedHearingId(value: string) {
        sessionStorage.setItem(this.SelectedHearingIdKey, value);
    }

    get selectedHearingId() {
        return sessionStorage.getItem(this.SelectedHearingIdKey);
    }

    get showSearch(): boolean {
        return this._showSearch;
    }

    set showSearch(value) {
        this._showSearch = value;
    }
}
