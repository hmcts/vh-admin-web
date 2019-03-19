import {BookingService} from '../../services/booking.service';
import {Router} from '@angular/router';
import {OnInit} from '@angular/core';

export abstract class BookingBaseComponent implements OnInit {

  buttonAction: string;
  editMode = false;

  protected constructor(protected bookingService: BookingService, protected router: Router) {
  }

  ngOnInit() {
    this.editMode = this.bookingService.isEditMode();
    this.buttonAction = this.editMode ? 'Save' : 'Next';
  }

  navigateToSummary() {
    this.resetEditMode();
    this.router.navigate(['/summary']);
  }

  resetEditMode() {
    this.bookingService.resetEditMode();
    this.editMode = false;
  }
}
