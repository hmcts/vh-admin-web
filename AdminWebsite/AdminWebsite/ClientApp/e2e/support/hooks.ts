import { Before, After, AfterAll, Status } from 'cucumber';
import { browser } from 'protractor';
import { config } from '../protractor.conf.js';

Before({timeout: 100 * 1000}, async (scenario) => {
    console.log('===== RUNNING TEST : ' + scenario.pickle.name + ' =====');
    await browser.waitForAngularEnabled(false);
    await browser.driver.manage().window().maximize().then(() => browser.ignoreSynchronization = false);
    console.log('Login using the Microsoft Login Page ');
    await browser.driver.navigate().to(config.baseUrl).then(() => browser.ignoreSynchronization = false);
 });

 After({timeout: 100 * 1000}, async (scenario) => {
    console.log('===== TEARDOWN FOR TEST : ' + scenario.pickle.name + ' =====');
    browser.restart();
 });

 AfterAll(function() {
    browser.executeScript('window.sessionStorage.clear();'); // clear session
    browser.executeScript('window.localStorage.clear();'); // clear local storage
 });
