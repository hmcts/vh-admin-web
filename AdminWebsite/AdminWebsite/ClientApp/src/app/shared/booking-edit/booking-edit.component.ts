import { Component, Input } from '@angular/core';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-booking-edit',
  templateUrl: './booking-edit.component.html',
})
export class BookingEditComponent {
  constructor(private bookingService: BookingService) { }

  private _editLink = '/';
  @Input()
  title: string;

  @Input()
  set editLink(editLink: string) {
    this._editLink = `/${editLink}`;
  }

  get editLink() {
    return this._editLink;
  }

  edit() {
    this.bookingService.setEditMode();
  }
}
