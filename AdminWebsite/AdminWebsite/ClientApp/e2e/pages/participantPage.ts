import { element, by, ElementFinder } from 'protractor';
import { Helpers } from '../features/support/helpers';
import { LocatorHelpers } from '../features/support/locatorHelpers';

export class ParticipantPageObject {
    private participantBreadcrumb = element(by.xpath('//li[@class=\'vh-breadcrumbs\']/a[text() = \'Add participants\']'));
    private participantPageTitle = element(by.xpath('//*[@class=\'govuk-heading-m\'][text()=\'Add a participant\']'));
    private participantWarningMessage = element(LocatorHelpers.getLocatorFromText('You have already added'));
    private emailField = element(by.id('participantEmail'));
    private roleDropDown = element(by.id('role'));
    private titleDropDown = element(by.id('title'));
    private firstNameField = element(by.id('firstName'));
    private lastNameField = element(by.id('lastName'));
    private telephoneField = element(by.id('phone'));
    private clearDetailsLink = element(by.id('clearFormBtn'));
    private nextButton = element(by.id('cancelBtn'));
    private cancelButton = element(by.id('cancelBtn'));
    private addParticipantButton = element(by.id('addParticipantBtn'));
    private participantsAdded = element.all(by.xpath('//*[@class=\'govuk-grid-column-two-thirds vhtable-header\']'));

    getParticipantPageTitle() {
        Helpers.WaitForElementDisplayed(this.participantPageTitle);
        return this.participantPageTitle.getText();
    }

    clickParticipantBreadcrumb() {
        Helpers.WaitForElementDisplayed(this.participantBreadcrumb);
        return this.participantBreadcrumb.click();
    }

    enterEmailField(email: string) {
        Helpers.WaitForElementDisplayed(this.emailField);
        return this.emailField.sendKeys(email);
    }

    selectRole(role: string) {
        Helpers.WaitForElementDisplayed(this.roleDropDown);
        return this.roleDropDown.sendKeys(role);
    }

    selectTitle(title: string) {
        Helpers.WaitForElementDisplayed(this.titleDropDown);
        return this.roleDropDown.sendKeys(title);
    }

    enterFirstName(firstname: string) {
        Helpers.WaitForElementDisplayed(this.firstNameField);
        return this.firstNameField.sendKeys(firstname);
    }

    enterLastName(lastname: string) {
        Helpers.WaitForElementDisplayed(this.lastNameField);
        return this.lastNameField.sendKeys(lastname);
    }

    enterTelephone(telephone: string) {
        Helpers.WaitForElementDisplayed(this.telephoneField);
        return this.telephoneField.sendKeys(telephone);
    }

    clickClearDeatils() {
        Helpers.WaitForElementDisplayed(this.clearDetailsLink);
        return this.clearDetailsLink.click();
    }

    clickNextButton() {
        Helpers.WaitForElementDisplayed(this.nextButton);
        return this.nextButton.click();
    }

    clcikCancelButton() {
        Helpers.WaitForElementDisplayed(this.cancelButton);
        return this.cancelButton.click();
    }
    clcikAddParticipantButton() {
        Helpers.WaitForElementDisplayed(this.addParticipantButton);
        return this.addParticipantButton.click();
    }

    getAddedParticpant() {
        Helpers.WaitForAllElementsDisplayed(this.participantsAdded);
        return this.participantsAdded;
    }

    getParticipantWarningMessage() {
        Helpers.WaitForElementDisplayed(this.participantWarningMessage);
        return this.participantWarningMessage.getText();
    }
}
