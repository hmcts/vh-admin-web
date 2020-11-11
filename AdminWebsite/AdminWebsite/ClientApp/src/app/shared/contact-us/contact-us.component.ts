import { Component } from '@angular/core';
import { Constants } from '../../common/constants';

@Component({
    selector: 'app-contact-us',
    templateUrl: './contact-us.component.html'
})
export class ContactUsComponent {
    contact = {
        phone: Constants.Contact.phone,
        email: Constants.Contact.email
    };
    constructor() {}
}
