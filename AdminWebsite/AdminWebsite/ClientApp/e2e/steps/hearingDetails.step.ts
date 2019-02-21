import { When, Then } from 'cucumber';
import { HearingDetailsPageObject } from '../pages/hearingDetailsPage';
import { HearingSchedulePageObject } from '../pages/hearingSchedulePage';
import { expect } from 'chai';

const data = require('../data/hearingDetailsTestData.json');

const MAX_STEP_TIMEOUT_IN_MS = 2;
const POLLING_STEP_EVERY_IN_MS = 5000;

When(/^I navigate to Hearing Details Page$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.clickVideoHearingPanel();
    await hearingDetailsPage.getHearingDetailsPageTitle().then(elem => expect(elem).contain(data.HearingDetailsPageTitle));
});

When(/^I fill in hearing details$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.enterCaseNumber(data.CaseNumber);
    await hearingDetailsPage.enterCaseName(data.CaseName);
    await hearingDetailsPage.selectCaseType(data.CaseType);
    await hearingDetailsPage.selectHearingchannel(data.HearingChannel);
    await hearingDetailsPage.selectHearingType(data.HearingType);
    await hearingDetailsPage.clickNextButton();
});

When(/^I try to navigate to next screen without filling the form$/, {
    timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.clickNextButton();
});

Then(/^Hearing details data is cached$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingSchedule = new HearingSchedulePageObject();
    await hearingSchedule.getHearingSchedulePageTitle().then(elem => expect(elem).contain('schedule'));
});

Then('{int} Mandatory fields are highlighted', {
    timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async (highlightedFields: number) => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.getErrorSummary().then(elem => expect(elem).equal(highlightedFields));
});

When(/^I fill in one or more fields$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.enterCaseNumber(data.CaseNumber);
    await hearingDetailsPage.enterCaseName(data.CaseName);
});

When(/^I try to cancel the booking$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.clickCancelButton();
});

When(/^I confirm booking Cancellation$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.getPopupMessage().then(elem => expect(elem).contain('You will lose all your booking details if you continue'));
    await hearingDetailsPage.clickPopupDiscardBooking();
});

When(/^I do not confirm booking Cancellation$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.getPopupMessage().then(elem => expect(elem).contain('You will lose all your booking details if you continue'));
    await hearingDetailsPage.clickPopupContinueWithBooking();
});

Then(/^The current page redirects to Dashboard screen$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.getVideoHearingPanelText().then(elem => expect(elem).contain('Book a video hearing'));
});

Then(/^I remain on the hearing details form screen$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const hearingDetailsPage = new HearingDetailsPageObject();
    await hearingDetailsPage.getHearingDetailsPageTitle().then(elem => expect(elem).contain(data.HearingDetailsPageTitle));
});
