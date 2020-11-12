import { Component } from '@angular/core';
import { BaseAccordionComponent } from '../shared/base-accordion-component';
import { Constants } from '../common/constants';

@Component({
    selector: 'app-unauthorised',
    templateUrl: './unauthorised.component.html',
    styleUrls: ['./unauthorised.component.css']
})
export class UnauthorisedComponent extends BaseAccordionComponent {
    readonly contactUsEmail = Constants.Contact.email;
}
