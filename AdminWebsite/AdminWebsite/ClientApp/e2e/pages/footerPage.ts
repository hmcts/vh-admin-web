import { element, by, ElementFinder } from 'protractor';
import { LocatorHelpers } from '../features/support/locatorHelpers';

export class FooterPageObject {

    public contactUsLink: ElementFinder;

    constructor() {
        this.contactUsLink = element(LocatorHelpers.getLocatorFromText('Contact us'));
    }

    clickContactUs() {
        return this.contactUsLink.click();
    }
}
