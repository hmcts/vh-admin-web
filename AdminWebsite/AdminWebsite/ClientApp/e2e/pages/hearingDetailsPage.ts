import { element, by, ElementFinder, browser } from 'protractor';
import { Helpers } from '../features/support/helpers';

export class HearingDetailsPageObject {
    private videoHearingPanel = element(by.xpath('//h1[@class=\'vhpanel-title\']'));
    private hearingDetailsPageTitle = element(by.xpath('//*[@class=\'govuk-heading-m\']'));
    private caseNumberField = element(by.id('caseNumber'));
    private caseNameField = element(by.id('caseName'));
    private caseTypeDropdown = element(by.id('caseType'));
    private hearingTypeDropdown = element(by.id('hearingType'));
    private hearingChannelDropdown = element(by.id('hearingMethod'));
    private nextButton = element(by.xpath('//input[@type = \'button\'][1]'));
    private cancelButton = element(by.xpath('//input[@type = \'button\'][2]'));
    private popupContinueWithBooking = element(by.id('btncancel'));
    private popupDiscardBooking = element(by.id('btnsubmit'));
    private popupMessage = element(by.xpath('//h1[(@class= \'govuk-heading-m\') and contains(text(),\'You will lose\')]'));
    private errorSummary = element.all(by.xpath('//a[contains(text(), \'Please enter\')]'));

    clickVideoHearingPanel() {
        Helpers.WaitForElementDisplayed(this.videoHearingPanel);
        return this.videoHearingPanel.click();
    }

    getVideoHearingPanelText() {
        Helpers.WaitForElementDisplayed(this.videoHearingPanel);
        return this.videoHearingPanel.getText();
    }

    getHearingDetailsPageTitle() {
        Helpers.WaitForElementDisplayed(this.hearingDetailsPageTitle);
        return this.hearingDetailsPageTitle.getText();
    }

    enterCaseNumber(casenumber: string) {
        Helpers.WaitForElementDisplayed(this.caseNumberField);
        this.caseNumberField.clear();
        return this.caseNumberField.sendKeys(casenumber);
    }

    enterCaseName(casename: string) {
        Helpers.WaitForElementDisplayed(this.caseNameField);
        this.caseNameField.clear();
        return this.caseNameField.sendKeys(casename);
    }

    getCaseNameText() {
        Helpers.WaitForElementDisplayed(this.caseNameField);
        return this.caseNameField.getText();
    }

    selectCaseType(casetype: string) {
        Helpers.WaitForElementDisplayed(this.caseTypeDropdown);
        return this.caseTypeDropdown.sendKeys(casetype);
    }

    selectHearingType(hearingtype: string) {
        Helpers.WaitForElementDisplayed(this.hearingTypeDropdown);
        return this.hearingTypeDropdown.sendKeys(hearingtype);
    }

    selectHearingchannel(hearingchannel: string) {
        Helpers.WaitForElementDisplayed(this.hearingChannelDropdown);
        return this.hearingChannelDropdown.sendKeys(hearingchannel);
    }

    clickNextButton() {
        Helpers.WaitForElementDisplayed(this.nextButton);
        return this.nextButton.click();
    }

    clickCancelButton() {
        Helpers.WaitForElementDisplayed(this.cancelButton);
        return this.cancelButton.click();
    }

    clickPopupContinueWithBooking() {
        Helpers.WaitForElementDisplayed(this.popupContinueWithBooking);
        return this.popupContinueWithBooking.click();
    }

    clickPopupDiscardBooking() {
        Helpers.WaitForElementDisplayed(this.popupDiscardBooking);
        return this.popupDiscardBooking.click();
    }

    getPopupMessage() {
        Helpers.WaitForElementDisplayed(this.popupMessage);
        return this.popupMessage.getText();
    }

    getErrorSummary() {
        return this.errorSummary.count();
    }
}
