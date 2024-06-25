import { Injectable } from '@angular/core';
import { DeviceDetectorService, BROWSERS } from 'ngx-device-detector';

@Injectable({
    providedIn: 'root'
})
export class DeviceType {
    constructor(private deviceDetectorService: DeviceDetectorService) {}

    isMobile() {
        return this.deviceDetectorService.isMobile();
    }

    isTablet() {
        return this.deviceDetectorService.isTablet();
    }

    isDesktop() {
        return this.deviceDetectorService.isDesktop();
    }

    isSupportedBrowser(): boolean {
        const unsupportedBrowsers = [
            BROWSERS.FB_MESSANGER,
            BROWSERS.SAMSUNG,
            BROWSERS.UCBROWSER,
            BROWSERS.OPERA,
            BROWSERS.UNKNOWN,
            BROWSERS.IE,
            BROWSERS.MS_EDGE
        ];
        const browser = this.deviceDetectorService.browser;
        return unsupportedBrowsers.indexOf(browser) === -1;
    }

    getBrowserName(): string {
        return this.deviceDetectorService.browser;
    }
}
