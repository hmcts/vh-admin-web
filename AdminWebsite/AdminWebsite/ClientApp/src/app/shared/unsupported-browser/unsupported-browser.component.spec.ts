import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DeviceType } from 'src/app/services/device-type';
import { UnsupportedBrowserComponent } from './unsupported-browser.component';

describe('UnsupportedBrowserComponent', () => {
    let component: UnsupportedBrowserComponent;
    let fixture: ComponentFixture<UnsupportedBrowserComponent>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceType>;
    const browserName = 'Opera';

    beforeEach(
        waitForAsync(() => {
            deviceTypeServiceSpy = jasmine.createSpyObj<DeviceType>(['getBrowserName']);
            deviceTypeServiceSpy.getBrowserName.and.returnValue(browserName);
            TestBed.configureTestingModule({
                declarations: [UnsupportedBrowserComponent],
                providers: [{ provide: DeviceType, useValue: deviceTypeServiceSpy }]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(UnsupportedBrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should initalise with browser information', () => {
        expect(component.supportedBrowsers.length).toBeGreaterThan(0);
        expect(component.browserName).toBe(browserName);
    });
});
