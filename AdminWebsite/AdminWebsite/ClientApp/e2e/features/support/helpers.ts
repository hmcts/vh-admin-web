import { browser, by, ExpectedConditions } from 'protractor';
import { WebdriverWebElement, ElementFinder, ElementArrayFinder } from 'protractor/built/element';

const MAX_WAIT_TIMEOUT_IN_MS = 20000; // 20 seconds

export class Helpers {

    public async waitUntilElementPresent(item: ElementFinder): Promise<Boolean> {
        const until = ExpectedConditions;
        return browser.wait(until.presenceOf(item), MAX_WAIT_TIMEOUT_IN_MS, `Element ${item.locator} is taking too long to become present in the DOM. Waiting Time : ${MAX_WAIT_TIMEOUT_IN_MS}`).then(() => {
            return true;
        }, () => {
            return false;
        });
    }

    public async waitUntilElementClickable(item: ElementFinder): Promise<Boolean> {
        const until = ExpectedConditions;
        return browser.wait(until.elementToBeClickable(item), MAX_WAIT_TIMEOUT_IN_MS, `Element ${item.locator} is taking too long to become clickable. Waiting Time : ${MAX_WAIT_TIMEOUT_IN_MS}`).then(() => {
            return true;
        }, () => {
            return false;
        });
    }

    public static async WaitForElementDisplayed(item: ElementFinder): Promise<Boolean> {
        const until = ExpectedConditions;
        return browser.wait(until.visibilityOf(item), MAX_WAIT_TIMEOUT_IN_MS, `Element ${item.locator} is taking too long to become visible. Waiting Time : ${MAX_WAIT_TIMEOUT_IN_MS}`).then(() => {
            return true;
        }, () => {
            return false;
        });
    }

    public static async WaitForAllElementsDisplayed(items: ElementArrayFinder): Promise<Boolean> {
        const until = ExpectedConditions;
        return browser.wait(until.visibilityOf(items.last()), MAX_WAIT_TIMEOUT_IN_MS, `Element ${items.last().locator} is taking too long to become visible. Waiting Time : ${MAX_WAIT_TIMEOUT_IN_MS}`).then(() => {
            return true;
        }, () => {
            return false;
        });
    }

    public static WaitForElementToDisappear(element: WebdriverWebElement): any {
        browser.wait(function () {
            return browser.isElementPresent(by.repeater('recentName in recentNames').row(0))
                .then(function (presenceOfElement) { return !presenceOfElement; });
        }, MAX_WAIT_TIMEOUT_IN_MS);
    }

    static SwitchTabs() {
        browser.getWindowHandle().then(function (parentGUID) {
            browser.getAllWindowHandles().then(function (allGUID) {
                console.log('Total Windows : ' + allGUID.length);

                for (const guid of allGUID) {
                    console.log('Window name : ' + guid);
                    if (guid !== parentGUID) {
                        console.log('Switching to window : ' + guid);
                        browser.switchTo().window(guid);
                        break;
                    }
                }
            });
        });
    }
}
