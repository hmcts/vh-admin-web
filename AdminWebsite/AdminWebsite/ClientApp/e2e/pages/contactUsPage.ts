import { element, by, ElementFinder } from 'protractor';
import { Helpers } from '../features/support/helpers';
import { LocatorHelpers } from '../features/support/locatorHelpers';

const data = require('../data/contactUsTestData.json');

export class ContactUsPageObject {

    public contactUsPageTitle: ElementFinder;
    public contactPhoneNumber: ElementFinder;
    public contactEmailAddress: ElementFinder;


    constructor() {
        this.contactUsPageTitle = element(LocatorHelpers.getLocatorFromText('Contact the video hearings service'));
        this.contactPhoneNumber = element(LocatorHelpers.getLocatorFromText(data.ContactUsPhoneNumber));
        this.contactEmailAddress = element(LocatorHelpers.getLocatorFromText(data.ContactUsEmailAddress));
    }

    getContactUsPageTitle() {
        Helpers.WaitForElementDisplayed(this.contactUsPageTitle);
        return this.contactUsPageTitle.getText();
    }

    getContactPhoneNumber() {
        return this.contactPhoneNumber.getText();
    }

    getContactEmail() {
        return this.contactEmailAddress.getText();
    }
}
