import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { Logger } from 'src/app/services/logger';

@Component({
    selector: 'app-cancel-booking-popup',
    templateUrl: './cancel-booking-popup.component.html'
})
export class CancelBookingPopupComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[CancelBookingPopup] -';
    @Output() cancelSingleDayBooking: EventEmitter<any> = new EventEmitter<string>();
    @Output() keepBooking: EventEmitter<any> = new EventEmitter<any>();
    @Output() cancelMultiDayBooking: EventEmitter<any> = new EventEmitter<string>();
    @Input() isMultiDayCancellationAvailable: boolean;

    cancelHearingForm: FormGroup;
    failedSubmission: boolean;
    selectedCancelReason: string;
    $subscriptions: Subscription[] = [];
    showDetails: boolean;
    maxInputLength = 256;

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

    constructor(private fb: FormBuilder, private logger: Logger) {}

    ngOnInit() {
        this.failedSubmission = false;
        this.showDetails = false;
        this.selectedCancelReason = this.cancelReasons[0];
        this.cancelHearingForm = this.fb.group({
            cancelReason: [this.selectedCancelReason, [Validators.required, Validators.pattern('^((?!Please select).)*$')]],
            cancelReasonDetails: ['', '']
        });

        this.$subscriptions.push(
            this.cancelReason.valueChanges.subscribe(val => {
                this.selectedCancelReason = val;
                this.showDetails = this.selectedCancelReason === 'Other (please provide details)';
                this.failedSubmission = false;
                if (this.showDetails) {
                    this.cancelReasonDetails.setValidators([
                        Validators.required,
                        Validators.pattern(Constants.TextInputPattern),
                        Validators.maxLength(this.maxInputLength)
                    ]);
                } else {
                    this.cancelReasonDetails.setValue('');
                    this.cancelReasonDetails.clearValidators();
                }
                this.cancelReasonDetails.updateValueAndValidity();
            })
        );
    }

    get currentInputLength(): number {
        if (this.cancelReasonDetails.value) {
            return this.cancelReasonDetails.value.length;
        } else {
            return 0;
        }
    }

    get cancelReason() {
        return this.cancelHearingForm.get('cancelReason');
    }

    get cancelReasonInvalid(): boolean {
        return this.cancelReason.invalid && (this.cancelReason.dirty || this.cancelReason.touched || this.failedSubmission);
    }

    get cancelReasonDetails() {
        return this.cancelHearingForm.get('cancelReasonDetails');
    }

    get cancelReasonDetailsInvalid(): boolean {
        return (
            this.cancelReasonDetails.invalid &&
            (this.cancelReasonDetails.dirty || this.cancelReasonDetails.touched || this.failedSubmission)
        );
    }

    get cancelReasonDetailsInvalidMaxLength(): boolean {
        return (
            this.cancelReasonDetails.invalid &&
            (this.cancelReasonDetails.dirty || this.cancelReasonDetails.touched || this.failedSubmission) &&
            this.cancelReasonDetails.hasError('maxlength')
        );
    }

    cancelHearing(isMultiDay: boolean): void {
        if (this.cancelHearingForm.valid && this.cancelReason.value !== Constants.PleaseSelect) {
            this.failedSubmission = false;
            const cancelHearingReason =
                this.cancelReasonDetails.value !== '' ? 'Other: ' + this.cancelReasonDetails.value : this.cancelReason.value;
            this.logger.debug(`${this.loggerPrefix} cancelling booking because ${cancelHearingReason}`);
            if (isMultiDay) {
                this.cancelMultiDayBooking.emit(cancelHearingReason);
            } else {
                this.cancelSingleDayBooking.emit(cancelHearingReason);
            }
        } else {
            this.failedSubmission = true;
        }
    }

    cancelSingleDayHearing(): void {
        this.cancelHearing(false);
    }

    cancelMultiDayHearing(): void {
        this.cancelHearing(true);
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
