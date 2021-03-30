import { AbstractControl, ValidatorFn } from '@angular/forms';

export function notPublicHolidayDateValidator(publicHolidays: Date[]): ValidatorFn {
    return (ctrl: AbstractControl) => {
        if (!publicHolidays.length) {
            return null;
        }
        if (ctrl.value) {
            const date = new Date(ctrl.value);
            if (!publicHolidays.includes(date)) {
                return { publicHoliday: true };
            }
        }
        return null;
    };
}
