import {BookingService} from '../../services/booking.service';
import {Router} from '@angular/router';
import {OnInit} from '@angular/core';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { FormGroup } from '@angular/forms';
import { VideoHearingsService } from '../../services/video-hearings.service';

export abstract class BookingBaseComponent implements OnInit {

  buttonAction: string;
  editMode = false;

  protected constructor(protected bookingService: BookingService, protected router: Router,
    protected videoHearingService: VideoHearingsService) {
  }

  ngOnInit() {
    this.editMode = this.bookingService.isEditMode();
    this.buttonAction = this.editMode ? 'Save' : 'Next';
  }

  navigateToSummary() {
    this.resetEditMode();
    this.router.navigate([PageUrls.Summary]);
  }

  resetEditMode() {
    this.bookingService.resetEditMode();
    this.editMode = false;
  }

  onChanged(currentForm: FormGroup) {
    currentForm.valueChanges.subscribe(x => {
      this.videoHearingService.onBookingChange(currentForm.dirty);
    });
  }
}
