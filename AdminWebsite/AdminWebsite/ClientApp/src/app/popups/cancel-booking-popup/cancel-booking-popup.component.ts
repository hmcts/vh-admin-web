import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ValidateForWhiteSpace } from 'src/app/shared/validators/whitespace-validator';

@Component({
  selector: 'app-cancel-booking-popup',
  templateUrl: './cancel-booking-popup.component.html'
})
export class CancelBookingPopupComponent implements OnInit, OnDestroy {

  @Output() cancelBooking: EventEmitter<any> = new EventEmitter<string>();
  @Output() keepBooking: EventEmitter<any> = new EventEmitter<any>();

  cancelHearingForm: FormGroup;
  failedSubmission: boolean;
  selectedCancelReason: string;
  $subscriptions: Subscription[] = [];
  showDetails: boolean;

  cancelReasons: string[] = [
    'Please select',
    'Equipment incompatible',
    'Abandonment (not heard from all parties)',
    'Online abandonment (incomplete registration)',
    'Adjournment',
    'Withdrawn',
    'Settled',
    'Judge decision',
    'Service failure',
    'Other (please provide details)'
  ];

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.failedSubmission = false;
    this.showDetails = false;
    this.selectedCancelReason = this.cancelReasons[0];
    this.cancelHearingForm = this.fb.group({
      cancelReason: [this.selectedCancelReason, [Validators.required, Validators.pattern('^((?!Please select).)*$')]],
      cancelReasonDetails: ['', '']
    });

    this.$subscriptions.push(this.cancelReason.valueChanges.subscribe(val => {
      this.selectedCancelReason = val;
      this.showDetails = this.selectedCancelReason === 'Other (please provide details)';
      console.log(this.selectedCancelReason);
      if (this.showDetails) {
        this.cancelReasonDetails.setValidators(
          [Validators.required, ValidateForWhiteSpace, Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)]);
      } else {
        this.cancelReasonDetails.clearValidators();
      }
      this.cancelReasonDetails.updateValueAndValidity();
    }));
  }

  get cancelReason() {
    return this.cancelHearingForm.get('cancelReason');
  }

  get cancelReasonInvalid() {
    return this.cancelReason.invalid && (this.cancelReason.dirty || this.cancelReason.touched || this.failedSubmission);
  }

  get cancelReasonDetails() {
    return this.cancelHearingForm.get('cancelReasonDetails');
  }

  get cancelReasonDetailsInvalid() {
    return this.cancelReasonDetails.invalid && (this.cancelReasonDetails.dirty ||
      this.cancelReasonDetails.touched || this.failedSubmission);
  }

  cancelHearing(): void {
    if (this.cancelHearingForm.valid && this.cancelReason.value !== Constants.PleaseSelect) {
      this.failedSubmission = false;
      const cancelHearingReason =
        this.cancelReasonDetails.value !== '' ? 'Other: ' + this.cancelReasonDetails.value : this.cancelReason.value;
      console.log(cancelHearingReason);
      this.cancelBooking.emit(cancelHearingReason);
    } else {
      this.failedSubmission = true;
    }
  }

  keepHearing(): void {
    this.keepBooking.emit();
  }

  ngOnDestroy() {
    this.$subscriptions.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }
}
