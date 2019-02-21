import { element, by } from 'protractor';
import { Helpers } from '../features/support/helpers';

export class HearingSchedulePageObject {
    private hearingSchedulePageTitle = element(by.xpath('//p[text()=\'schedule\']'));

    getHearingSchedulePageTitle() {
        Helpers.WaitForElementDisplayed(this.hearingSchedulePageTitle);
        return this.hearingSchedulePageTitle.getText();
    }
}
