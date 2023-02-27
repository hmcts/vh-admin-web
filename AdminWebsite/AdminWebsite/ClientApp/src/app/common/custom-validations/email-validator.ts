import { AbstractControl } from '@angular/forms';
import { Constants } from '../constants';

export function validEmail(control: AbstractControl) {
    const valid = isAValidEmail(control.value);
    if (!valid) {
        return { validEmail: true };
    }
    return null;
}

export function isAValidEmail(input: string) {
    return Constants.EmailPattern.test(input);
}
