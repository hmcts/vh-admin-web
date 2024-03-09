import { AbstractControl, ValidatorFn, FormGroup } from '@angular/forms';

// Custom validator function to check for uniqueness
export const uniqueDateValidator: ValidatorFn = (control: AbstractControl): { [key: string]: any } | null => {
    const dates = control.value;

    // Check if any dates are duplicated
    const uniqueDates = new Set(dates);
    if (dates.length !== uniqueDates.size) {
        return { nonUniqueDates: true };
    }
    return null;
};
