import { browser, ProtractorBrowser } from 'protractor';
import { LoginPageObject } from '../pages/loginPage';

export class Context {

    public browser: ProtractorBrowser;
    public loginPage: LoginPageObject;

    constructor() {
        this.browser = browser;
        this.loginPage = new LoginPageObject();
    }
}
