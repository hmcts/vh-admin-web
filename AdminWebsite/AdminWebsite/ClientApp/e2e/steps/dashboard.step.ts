import { expect } from 'chai';
import { Given, Then, When } from 'cucumber';
import { browser } from 'protractor';
import { LoginPageObject } from '../pages/loginPage';
import { DashboardPage } from '../pages/dashboardPage';
import { HearingDetailsPageObject } from '../pages/hearingDetailsPage';

const MAX_STEP_TIMEOUT_IN_MS = 2;
const POLLING_STEP_EVERY_IN_MS = 5000;

Given('I navigate to the Microsoft Login Screen', { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
  await browser.waitForAngularEnabled(false);
  await browser.getCurrentUrl().then(elem => expect(elem).contain('login.microsoftonline.com'));
});

Then('I am logged into the Booking UI', { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
  await browser.waitForAngularEnabled(true);
  await browser.getCurrentUrl().then(elem => expect(elem).contain('dashboard'));
});

Then('The error message contains {string}', {
  timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS
}, async (expectedErrorMessage: string) => {
  await browser.waitForAngularEnabled(false);
  const loginPage = new LoginPageObject();
  await loginPage.getErrorMessage().then(elem => expect(elem).contain(expectedErrorMessage));
});

When(/^I try to navigate to the Dashboard$/, {
  timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS
}, async () => {
  const dashboardPage = new DashboardPage();
  await dashboardPage.clickDashboard();
});

Then('A warning message is displayed as {string}', {
  timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS
}, async (warningMessage: string) => {
  const hearingDetailsPage = new HearingDetailsPageObject();
  await hearingDetailsPage.getPopupMessage().then(elem => expect(elem).contain(warningMessage));
});
