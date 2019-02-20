import { When, Then } from 'cucumber';
import { ParticipantPageObject } from '../pages/participantPage';
import { JudgePageObject } from '../pages/judgePage';
import { HearingDetailsPageObject } from '../pages/hearingDetailsPage';
import { browser } from 'protractor';
import { expect } from 'chai';
import { HearingSchedulePageObject } from '../pages/hearingSchedulePage';

const data = require('../data/hearingDetailsTestData.json');
const participantData = require('../data/participantTestData.json');

const MAX_STEP_TIMEOUT_IN_MS = 2;
const POLLING_STEP_EVERY_IN_MS = 5000;

When(/^I navigate to add participant Page$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    await browser.waitForAngularEnabled(true);
    const participantPage = new ParticipantPageObject();
    const judgePage = new JudgePageObject();
    const hearingDetailsPage = new HearingDetailsPageObject();
    const hearingSchedule = new HearingSchedulePageObject();
    await hearingDetailsPage.clickVideoHearingPanel();
    await hearingDetailsPage.getHearingDetailsPageTitle().then(elem => expect(elem).contain(data.HearingDetailsPageTitle));
    await hearingDetailsPage.enterCaseNumber(data.CaseNumber);
    await hearingDetailsPage.enterCaseName(data.CaseName);
    await hearingDetailsPage.selectCaseType(data.CaseType);
    await hearingDetailsPage.selectHearingchannel(data.HearingChannel);
    await hearingDetailsPage.selectHearingType(data.HearingType);
    await hearingDetailsPage.clickNextButton();
    await hearingSchedule.getHearingSchedulePageTitle().then(elem => expect(elem).contain('schedule'));
    await judgePage.clickAssignJudgeBreadcrumb();
    await participantPage.clickParticipantBreadcrumb();
    await participantPage.getParticipantPageTitle().then(elem => expect(elem).contain(participantData.AddParticipantPageTitle));
});

When(/^I add participants to a video hearing$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const participantPage = new ParticipantPageObject();
    const participant = participantData.Participants;
    for (let i = 0; i < participant.length; i++) {
        await participantPage.enterEmailField(participant[i].Email);
        await participantPage.selectRole(participant[i].Role);
        await participantPage.selectTitle(participant[i].Title);
        await participantPage.enterFirstName(participant[i].Firstname);
        await participantPage.enterLastName(participant[i].Lastname);
        await participantPage.enterTelephone(participant[i].Telephone);
        await participantPage.clcikAddParticipantButton();
    }
});
Then(/^Participants are added/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const participantPage = new ParticipantPageObject();
    const participant = participantData.Participants;
    const participantAdded = participantPage.getAddedParticpant();
    for (let i = 0; i < participant.length; i++) {
        const expectedParticipantAdded = participant[i].Firstname + ' ' + participant[i].Lastname;
        for (const j = 0; j < participantAdded.length; i++) {
            await participantAdded[j].getText().then(elem => expect(elem).contain(expectedParticipantAdded));
        }
    }
});

When(/^I attempt to add same participant twice$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const participantPage = new ParticipantPageObject();
    const participant = participantData.Participants;
    let i = 0;
    do {
        await participantPage.enterEmailField(participant[0].Email);
        await participantPage.selectRole(participant[0].Role);
        await participantPage.selectTitle(participant[0].Title);
        await participantPage.enterFirstName(participant[0].Firstname);
        await participantPage.enterLastName(participant[0].Lastname);
        await participantPage.enterTelephone(participant[0].Telephone);
        await participantPage.clcikAddParticipantButton();
        i++;
    }
    while (i <= 1);
});

Then('Warning message is displayed as {string} participant', {
    timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS
}, async (warningMessage: string) => {
    const participantPage = new ParticipantPageObject();
    await participantPage.getParticipantWarningMessage().then(elem => expect(elem).contain(warningMessage));
});

When(/^I fill in some of the fields$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async () => {
    const participantPage = new ParticipantPageObject();
    await participantPage.enterEmailField(participantData.Participants[0].Email);
    await participantPage.selectRole(participantData.Participants[0].Role);
});
