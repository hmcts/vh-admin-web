import { AbstractControl, ValidatorFn } from "@angular/forms";

export function weekendValidator(): ValidatorFn {
    return (ctrl: AbstractControl) => {
        if (ctrl.value) {
            var date = new Date(ctrl.value);
            if (date.getDay() == 6 || date.getDay() == 0) {
                return { 'weekend': true }
            }
        }
        return null;
    };
}