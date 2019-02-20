import { When, Then } from 'cucumber';
import { FooterPageObject } from '../pages/footerPage';
import { ContactUsPageObject } from '../pages/contactUsPage';
import { expect } from 'chai';
import { browser } from 'protractor';
import { Helpers } from '../features/support/helpers';

const data = require('../data/contactUsTestData.json');

const MAX_STEP_TIMEOUT_IN_MS = 2;
const POLLING_STEP_EVERY_IN_MS = 5000;

When(/^I navigate to the contact us page$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    await browser.waitForAngularEnabled(true);
    const footerPage = new FooterPageObject();
    await footerPage.clickContactUs();
});

Then(/^a new tab opens so the user will not lose any information entered into forms$/, {
    timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    await browser.waitForAngularEnabled(true);
    const contactUsPage = new ContactUsPageObject();
    await Helpers.SwitchTabs();
    await contactUsPage.getContactUsPageTitle().then(elem => expect(elem).contain(data.ContactUsPageTitle));
});

Then(/^the phone number and email address are displayed$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    await browser.waitForAngularEnabled(true);
    const contactUsPage = new ContactUsPageObject();
    await contactUsPage.getContactPhoneNumber().then(elem => expect(elem).contain(data.ContactUsPhoneNumber));
    await contactUsPage.getContactEmail().then(elem => expect(elem).contain(data.ContactUsEmailAddress));
});
