import { Injectable } from '@angular/core';
import { BookingsListModel } from '../common/model/bookings-list.model';

@Injectable({ providedIn: 'root' })
export class BookingPersistService {

  private _bookingList: Array<BookingsListModel> = [];
  private _nextCursor: string;
  private _selectedGroupIndex: number;
  private _selectedItemIndex: number;

  resetAll() {
    this._bookingList = [];
    this._nextCursor = undefined;
    this.selectedGroupIndex = -1;
    this.selectedItemIndex = -1;
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
}
