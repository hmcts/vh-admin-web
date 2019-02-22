import { Component, OnInit, Inject } from '@angular/core';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingsListModel } from '../../common/model/bookings-list.model';
import { BookingsResponse } from '../../services/clients/api-client';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-bookings-list',
  templateUrl: './bookings-list.component.html',
  styleUrls: ['./bookings-list.component.css']
})
export class BookingsListComponent implements OnInit {
  bookings: Array<BookingsListModel> = [];
  loaded: boolean = false;
  error: boolean = false;
  cursor: string = "0";
  limit: number = 100;
  endOfData: boolean = false;
  recordsLoaded: boolean = false;

  selectedItemIndex = -1;
  selectedGroupIndex = -1;
  showDetails = false;
  selectedElement: HTMLElement;
  selectedHearingId: number = 0;

  constructor(private bookingsListService: BookingsListService,
    @Inject(DOCUMENT) document) { }

  ngOnInit() {
    this.getList();
  }

  getList() {
    if (!this.endOfData) {
      const self = this;
      this.loaded = false;
      this.error = false;
      this.bookingsListService.getBookingsList(this.cursor, this.limit)
        .subscribe(book => { return self.loadData(book); }, err => self.handleError(err));
    }
  }

  private handleError(err) {
    console.log(err);
    this.error = true;
  }

  private loadData(bookingsResponse: BookingsResponse) {
    if (!bookingsResponse) {
      this.error = true;
      return;
    }
    let bookingsModel = this.bookingsListService.mapBookingsResponse(bookingsResponse);
    if (bookingsModel.NextCursor == "0" || bookingsModel.Hearings.length == 0) {
      this.endOfData = true;
      return;
    }
    this.cursor = bookingsModel.NextCursor;

    if (bookingsModel.Hearings) {
      this.bookings = this.bookingsListService.addBookings(bookingsModel, this.bookings);
    }
    this.recordsLoaded = true;
    this.loaded = true;
  }

  scrollHandler(e) {
    this.getList();
  }

  rowSelected(groupByDate, indexHearing) {
    if (this.selectedGroupIndex > -1 && this.selectedItemIndex > -1) {
      this.bookings[this.selectedGroupIndex].BookingsDetails[this.selectedItemIndex].Selected = false;
    }
    this.bookings[groupByDate].BookingsDetails[indexHearing].Selected = true;
    this.selectedHearingId = this.bookings[groupByDate].BookingsDetails[indexHearing].HearingId;
    this.selectedGroupIndex = groupByDate;
    this.selectedItemIndex = indexHearing;
    this.showDetails = true;
  }

  closeHearingDetails() {
    this.showDetails = false;
    setTimeout(() => {
      this.selectedElement = document.getElementById(this.selectedGroupIndex + '_' + this.selectedItemIndex) as HTMLElement;
      this.selectedElement.scrollIntoView(false);
    }, 500);
  }
}