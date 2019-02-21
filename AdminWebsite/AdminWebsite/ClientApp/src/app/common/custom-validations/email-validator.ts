import { AbstractControl } from '@angular/forms';

export function validEmail(control: AbstractControl) {
    const pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const valid = pattern.test(control.value);
    if (!valid) {
      return {validEmail: true};
    }
    return null;
}
