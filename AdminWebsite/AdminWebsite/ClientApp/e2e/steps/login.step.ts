import { Given, When } from 'cucumber';
import { browser } from 'protractor';
import { TestType } from '../features/support/enumarations/testType';
import { LoginPageObject } from '../pages/loginPage';
import { expect } from 'chai';

const data = require('../data/adminusers.json');
const MAX_STEP_TIMEOUT_IN_MS = 2;
const POLLING_STEP_EVERY_IN_MS = 5000;
const VALID_EMAIL = data.VALID_EMAIL;
const INVALID_EMAIL = 'invalid_email';
const NONEXISTENT_EMAIL = 'non_existant_user@doesntexist.com';
const VALID_PASSWORD = data.VALID_PASSWORD;
const INVALID_PASSWORD = 'invalid';

When(/^I submit a valid username and (.*) password in AD$/, {
  timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async (passwordType: TestType) => {
  await browser.waitForAngularEnabled(false);
  const loginPage = new LoginPageObject();
  loginPage.enterUsername(VALID_EMAIL);
  await loginPage.clickNext();
  if (passwordType === TestType.Valid) {
    await loginPage.enterPassword(VALID_PASSWORD);
    await loginPage.clickSignIn();
    await loginPage.dontStaySignedIn();
  } else {
    await loginPage.enterPassword(INVALID_PASSWORD);
    await loginPage.clickSignIn();
  }
});

When(/^I submit a (.*) username in AD$/, { timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS }, async (testType: TestType) => {
  await browser.waitForAngularEnabled(false);
  const loginPage = new LoginPageObject();
  switch (testType) {
    case TestType.Invalid: {
      loginPage.enterUsername(INVALID_EMAIL);
      await loginPage.clickNext();
      break;
    }
    case TestType.Nonexistant: {
      loginPage.enterUsername(NONEXISTENT_EMAIL);
      await loginPage.clickNext();
      break;
    }
    default: throw new Error('Test type does not exist');
  }
});

Given(/^I am logged in to the application$/, {timeout: MAX_STEP_TIMEOUT_IN_MS * POLLING_STEP_EVERY_IN_MS}, async () => {
  await browser.waitForAngularEnabled(false);
  await browser.getCurrentUrl().then(elem => expect(elem).contain('login.microsoftonline.com'));
  const loginPage = new LoginPageObject();
  loginPage.enterUsername(VALID_EMAIL);
  await loginPage.clickNext();
  await loginPage.enterPassword(VALID_PASSWORD);
  await loginPage.clickSignIn();
  await loginPage.dontStaySignedIn();
});
