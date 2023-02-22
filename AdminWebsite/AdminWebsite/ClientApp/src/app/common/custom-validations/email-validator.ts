import { AbstractControl } from '@angular/forms';

export function validEmail(control: AbstractControl) {
    const valid = isAValidEmail(control.value);
    if (!valid) {
        return { validEmail: true };
    }
    return null;
}

export function isAValidEmail(input: string) {
    /* tslint:disable: max-line-length */
    const pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(input);
}
