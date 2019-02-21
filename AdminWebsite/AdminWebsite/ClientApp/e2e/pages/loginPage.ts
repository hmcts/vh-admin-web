import { element, by, ElementFinder } from 'protractor';
import { Helpers } from '../features/support/helpers';

export class LoginPageObject {
    public usernameTextfield: ElementFinder;
    public passwordTextfield: ElementFinder;
    public nextButton: ElementFinder;
    public signInButton: ElementFinder;
    public noButton: ElementFinder;
    public errorMessage: ElementFinder;

    constructor() {
        this.usernameTextfield = element(by.css('#i0116'));
        this.passwordTextfield = element(by.xpath('//input[contains(@data-bind,\'password\') and (@name=\'passwd\')]'));
        this.nextButton = element(by.xpath('//input[contains(@data-bind,\'Next\') and (@value=\'Next\')]'));
        this.signInButton = element(by.xpath('//input[contains(@data-bind,\'SignIn\') and (@value=\'Sign in\')]'));
        this.noButton = element(by.xpath('//input[contains(@data-bind,\'Splitter\') and (@value=\'No\')]'));
        this.errorMessage = element(by.xpath('//div[contains(@id,\'Error\')]'));
    }

    enterUsername(username: string) {
        this.usernameTextfield.clear();
        return this.usernameTextfield.sendKeys(username);
    }

    enterPassword(password: string) {
        this.passwordTextfield.clear();
        return this.passwordTextfield.sendKeys(password);
    }

    clickNext() {
        return this.nextButton.click();
    }

    clickSignIn() {
        Helpers.WaitForElementDisplayed(this.signInButton);
        return this.signInButton.click();
    }

    dontStaySignedIn() {
        Helpers.WaitForElementDisplayed(this.noButton);
        return this.noButton.click();
    }

    getErrorMessage() {
        Helpers.WaitForElementDisplayed(this.errorMessage);
        return this.errorMessage.getText();
    }
}
