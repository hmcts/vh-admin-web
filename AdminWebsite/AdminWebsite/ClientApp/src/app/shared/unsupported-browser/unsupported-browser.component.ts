import { Component } from '@angular/core';
import { SupportedBrowserModel } from './SupportedBrowserModel';
import { DeviceType } from 'src/app/services/device-type';

@Component({
    selector: 'app-unsupported-browser',
    templateUrl: './unsupported-browser.component.html',
    styleUrls: ['./unsupported-browser.component.scss']
})
export class UnsupportedBrowserComponent {
    supportedBrowsers: SupportedBrowserModel[] = [];

    browserName: string;

    constructor(private readonly deviceTypeService: DeviceType) {
        this.browserName = this.deviceTypeService.getBrowserName();
        this.supportedBrowsers.push(new SupportedBrowserModel('Chrome'));
    }
}
