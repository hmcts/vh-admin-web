import { TestBed, inject } from '@angular/core/testing';
import { DeviceType } from './device-type';
import { DeviceDetectorService } from 'ngx-device-detector';

class MockDeviceDetectorService {
  browser = 'FireFox';
  isMobile() { return false; }
  isTablet() { return false; }
  isDesktop() { return true; }
}

describe('DeviceType', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: DeviceDetectorService, useClass: MockDeviceDetectorService }]
    });
  });

  it('should return false for a mobile device', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    const deviceType = new DeviceType(deviceDetectorService);
    expect(deviceType.isMobile()).toBeFalsy();
  }));
  it('should return false for a tablet device', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    const deviceType = new DeviceType(deviceDetectorService);
    expect(deviceType.isTablet()).toBeFalsy();
  }));
  it('should return true for a desktop device', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    const deviceType = new DeviceType(deviceDetectorService);
    expect(deviceType.isDesktop()).toBeTruthy();
  }));
  it('should return browser name', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    const deviceType = new DeviceType(deviceDetectorService);
    expect(deviceType.getBrowserName()).toBe('FireFox');
  }));
  it('should return true if browser is supported', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    const deviceType = new DeviceType(deviceDetectorService);
    expect(deviceType.isSupportedBrowser()).toBeTruthy();
  }));
  it('should return false if browser is not supported', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    deviceDetectorService.browser = 'Opera';
    const deviceType = new DeviceType(deviceDetectorService);
    expect(deviceType.isSupportedBrowser()).toBeFalsy();
  }));
});
