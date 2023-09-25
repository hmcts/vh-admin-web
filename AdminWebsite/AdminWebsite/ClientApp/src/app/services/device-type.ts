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
        const supportedBrowsers = [BROWSERS.CHROME, BROWSERS.MS_EDGE_CHROMIUM, BROWSERS.MS_EDGE, BROWSERS.FIREFOX];
        const browser = this.deviceDetectorService.browser;
        return supportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) > -1;
    }

    getBrowserName(): string {
        return this.deviceDetectorService.browser;
    }
}
