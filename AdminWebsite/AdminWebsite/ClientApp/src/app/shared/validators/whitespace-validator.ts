import { AbstractControl } from '@angular/forms';

export function ValidateForWhiteSpace(control: AbstractControl) {
  if (!!control.value && control.value.trim().length > 2) {
    return null;
  }
  return { validInput: true };
}
