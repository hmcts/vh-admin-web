import { browser, by, element } from 'protractor';
import { Helpers } from '../features/support/helpers';

export class DashboardPage {
  private dashBoard = element(by.xpath('//*[@id=\'navigation\']/li/a'));
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return browser.findElement(by.xpath('//*[@id=\'main-content\']/app-dashboard/p')).getText();
  }

  maximizeBrowser() {
    return browser.manage().window().maximize();
  }

  getLogoTypeText() {
    return element(by.xpath('//*[@class=\'hmcts-header__logotype-text\']')).getText();
  }

  clickDashboard() {
    Helpers.WaitForElementDisplayed(this.dashBoard);
    return this.dashBoard.click();
  }
}
