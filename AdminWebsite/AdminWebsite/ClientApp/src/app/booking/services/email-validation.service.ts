import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class EmailValidationService {

    constructor() {}

    validateEmail(email: string, invalidPattern: string): boolean {
        /* tslint:disable: max-line-length */
        const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(?:[a-zA-Z0-9](?:\.[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        const isValidEmail =
            email &&
            email.length > 0 &&
            email.length < 256 &&
            pattern.test(email.toLowerCase()) &&
            email.toLowerCase().indexOf(invalidPattern) < 0;
        return isValidEmail;
    }

    hasCourtroomAccountPattern(email: string, invalidPattern: string): boolean {
        return email?.toLowerCase().indexOf(invalidPattern) > -1;
    }
}
