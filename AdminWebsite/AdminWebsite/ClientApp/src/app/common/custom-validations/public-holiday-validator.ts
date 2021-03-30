import { AbstractControl, ValidatorFn } from '@angular/forms';

export function notPublicHolidayDateValidator(publicHolidays: Date[]): ValidatorFn {
    return (ctrl: AbstractControl) => {
        if (!publicHolidays.length) {
            return null;
        }
        const pbTimes = publicHolidays.map(x => x.getTime());
        if (ctrl.value) {
            const date = new Date(ctrl.value);
            if (pbTimes.includes(date.getTime())) {
                return { publicHoliday: true };
            }
        }
        return null;
    };
}
