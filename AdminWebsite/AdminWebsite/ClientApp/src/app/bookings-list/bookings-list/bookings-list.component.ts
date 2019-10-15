import { Component, OnInit, Inject} from '@angular/core';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingsListModel, BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { BookingsResponse } from '../../services/clients/api-client';
import { DOCUMENT } from '@angular/common';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { BookingsModel } from '../../common/model/bookings.model';
import { Router } from '@angular/router';
import { PageUrls } from '../../shared/page-url.constants';
import { VideoHearingsService } from '../../services/video-hearings.service';

@Component({
  selector: 'app-bookings-list',
  templateUrl: './bookings-list.component.html',
  styleUrls: ['./bookings-list.component.css']
})
export class BookingsListComponent implements OnInit {
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

  constructor(private bookingsListService: BookingsListService,
    private bookingPersistService: BookingPersistService,
    private videoHearingService: VideoHearingsService,
    private router: Router,
    @Inject(DOCUMENT) document) { }

  async ngOnInit() {
    if (this.bookingPersistService.bookingList.length > 0) {
      this.cursor = this.bookingPersistService.nextCursor;

      const editHearing = await this.getEditedBookingFromStorage();

      // update item in the list by item from database
      const updatedBooking = this.bookingPersistService.updateBooking(editHearing);

      if (updatedBooking.IsStartTimeChanged) {
        this.bookingsListService.replaceBookingRecord(updatedBooking, this.bookingPersistService.bookingList);
      }

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
    const selectedRecord = this.bookingPersistService.bookingList[this.bookingPersistService.selectedGroupIndex]
      .BookingsDetails[this.bookingPersistService.selectedItemIndex];
    const response = await this.videoHearingService.getHearingById(selectedRecord.HearingId).toPromise();
    const editHearing = this.videoHearingService.mapHearingDetailsResponseToHearingModel(response);
    return editHearing;
  }

  resetBookingIndex(booking: BookingsDetailsModel) {
    const dateOnly = new Date(booking.StartTime.valueOf());
    const dateNoTime = new Date(dateOnly.setHours(0, 0, 0, 0));
    this.selectedGroupIndex = this.bookings.findIndex(s => s.BookingsDate.toString() === dateNoTime.toString());
    if (this.selectedGroupIndex > -1) {
      this.selectedItemIndex = this.bookings[this.selectedGroupIndex].BookingsDetails.findIndex(x => x.HearingId === booking.HearingId);
    }
  }

  getList() {
    if (!this.endOfData) {
      const self = this;
      this.loaded = false;
      this.error = false;
      this.bookingsListService.getBookingsList(this.cursor, this.limit)
        .subscribe(book => self.loadData(book), err => self.handleError(err));
    }
  }

  private handleError(err) {
    this.error = true;
  }

  private loadData(bookingsResponse: BookingsResponse) {
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
    this.setSelectedRow(groupByDate, indexHearing);
    this.videoHearingService.cancelRequest();
    this.persistInformation();
    this.router.navigate([PageUrls.BookingDetails]);
  }

  setSelectedRow(groupByDate, indexHearing) {
    if (this.selectedGroupIndex > -1 && this.selectedItemIndex > -1) {
      this.bookings[this.selectedGroupIndex].BookingsDetails[this.selectedItemIndex].Selected = false;
    }
    if (groupByDate < this.bookings.length && indexHearing < this.bookings[groupByDate].BookingsDetails.length) {
      this.bookings[groupByDate].BookingsDetails[indexHearing].Selected = true;
      this.selectedHearingId = this.bookings[groupByDate].BookingsDetails[indexHearing].HearingId;
      this.selectedGroupIndex = groupByDate;
      this.selectedItemIndex = indexHearing;
    }
  }

    unselectRows(groupByDate, indexHearing) {
      if (groupByDate > -1 && indexHearing > -1) {
        this.bookings[groupByDate].BookingsDetails[indexHearing].Selected = false;
      }
  }

  persistInformation() {
    this.bookingPersistService.bookingList = this.bookings;
    this.bookingPersistService.nextCursor = this.cursor;
    this.bookingPersistService.selectedGroupIndex = this.selectedGroupIndex;
    this.bookingPersistService.selectedItemIndex = this.selectedItemIndex;
    // hearing id is stored in session storage
    this.bookingPersistService.selectedHearingId = this.selectedHearingId;
  }

  closeHearingDetails() {
    setTimeout(() => {
      this.selectedElement = document.getElementById(this.selectedGroupIndex + '_' + this.selectedItemIndex);
      if (this.selectedElement) {
        this.selectedElement.scrollIntoView(false);
      }
    }, 500);
  }

}
