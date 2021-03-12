import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class EmailValidationService {
    constructor() {}

    validateEmail(email: string, invalidPattern: string): boolean {
        return email && email.indexOf(invalidPattern) < 0;
    }

    hasCourtroomAccountPattern(email: string, invalidPattern: string): boolean {
        return email?.indexOf(invalidPattern) > -1;
    }
}
