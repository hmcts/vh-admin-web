import { AbstractControl, ValidatorFn } from '@angular/forms';

export function exclusionValidator(exclude: string): ValidatorFn {
    return (control: AbstractControl) => {
        console.log(control.value);
        if(control.value && (control.value as string).includes(exclude)) {
            console.log('fail')
            return { excludes: true };
        }
        return { excludes: null };
    };
  }