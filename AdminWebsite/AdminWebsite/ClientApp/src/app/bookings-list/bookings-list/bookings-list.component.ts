import { Component, OnInit, Inject, AfterViewInit } from '@angular/core';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingsListModel } from '../../common/model/bookings-list.model';
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
export class BookingsListComponent implements OnInit, AfterViewInit {
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

  ngOnInit() {
    if (this.bookingPersistService.bookingList.length > 0) {
      this.cursor = this.bookingPersistService.nextCursor;
      const editHearing = this.videoHearingService.getCurrentRequest();
      this.bookingPersistService.updateBooking(editHearing);
      this.videoHearingService.cancelRequest();
      this.bookings = this.bookingPersistService.bookingList;
      this.loaded = true;
      this.recordsLoaded = true;
      setTimeout(() => {
        this.setSelectedRow(this.bookingPersistService.selectedGroupIndex, this.bookingPersistService.selectedItemIndex);
        this.bookingPersistService.resetAll();
      }, 500);
    } else {
      this.getList();
    }
  }

  ngAfterViewInit() {
    if (this.bookingPersistService.bookingList.length > 0) {
      this.closeHearingDetails();
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
    this.router.navigate([PageUrls.BookingDetails, this.selectedHearingId]);
  }

  setSelectedRow(groupByDate, indexHearing) {
    if (this.selectedGroupIndex > -1 && this.selectedItemIndex > -1) {
      this.bookings[this.selectedGroupIndex].BookingsDetails[this.selectedItemIndex].Selected = false;
    }
    this.bookings[groupByDate].BookingsDetails[indexHearing].Selected = true;
    this.selectedHearingId = this.bookings[groupByDate].BookingsDetails[indexHearing].HearingId;
    this.selectedGroupIndex = groupByDate;
    this.selectedItemIndex = indexHearing;
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
      this.selectedElement.scrollIntoView(false);
    }, 500);
  }
}
