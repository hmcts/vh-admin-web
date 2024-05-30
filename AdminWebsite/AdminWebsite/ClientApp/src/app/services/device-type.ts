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
        return true;
    }

    getBrowserName(): string {
        return this.deviceDetectorService.browser;
    }
}
