import { element, by } from 'protractor';
import { Helpers } from '../features/support/helpers';

export class JudgePageObject {
    private assignJudgeBreadcrumb = element(by.xpath('//li[@class=\'vh-breadcrumbs\']/a[text() = \'Assign judge\']'));
    private assignJudgePageTitle = element(by.xpath('//p[text()=\'judge\']'));

    clickAssignJudgeBreadcrumb() {
        Helpers.WaitForElementDisplayed(this.assignJudgeBreadcrumb);
        return this.assignJudgeBreadcrumb.click();
    }

    getAssignJudgePageTitle() {
        Helpers.WaitForElementDisplayed(this.assignJudgePageTitle);
        return this.assignJudgePageTitle.getText();
    }
}
