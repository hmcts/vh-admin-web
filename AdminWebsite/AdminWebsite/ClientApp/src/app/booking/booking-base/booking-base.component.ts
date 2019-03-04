import { BookingService } from '../../services/booking.service';
import { Router } from '@angular/router';

export abstract class BookingBaseComponent {

  buttonAction: string;
  editMode: boolean = false;

  constructor(protected bookingService: BookingService, protected router:Router) {
  }

  ngOnInit() {
    let editModeParameter = this.bookingService.isEditMode();
    this.editMode = editModeParameter;
    this.buttonAction = this.editMode ? 'Save' : 'Next'
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
