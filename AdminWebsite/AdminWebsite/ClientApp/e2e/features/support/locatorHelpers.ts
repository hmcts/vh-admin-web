import { browser, by } from 'protractor';

export class LocatorHelpers {

    static getLocatorFromText(text: string) {
        return by.xpath('//*[contains(text(),\'' + text + '\')]');
    }

}
