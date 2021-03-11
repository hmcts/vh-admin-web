import { AbstractControl, ValidatorFn } from '@angular/forms';

export function pastDateValidator(): ValidatorFn {
    return (ctrl: AbstractControl) => {
        if (ctrl.value) {
            const date = new Date(ctrl.value);
            const now = new Date();
            now.setHours(0, 0);
            if (date.valueOf() < now.valueOf()) {
                return { pastdate: true };
            }
        }
        return null;
    };
}
