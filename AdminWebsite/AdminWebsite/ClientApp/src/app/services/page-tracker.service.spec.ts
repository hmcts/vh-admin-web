import { TestBed, tick, fakeAsync } from '@angular/core/testing';
import { PageTrackerService } from './page-tracker.service';
import { AppInsightsLogger } from './app-insights-logger.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Component, NgModule } from '@angular/core';

@Component({ selector: 'app-mock-component', template: '' })
class MockComponent {}

@NgModule({ declarations: [MockComponent] })
export class StubModule {}

describe('PageTrackerService', () => {
    let pageTrackerService: PageTrackerService;
    let appInsightsLogger: jasmine.SpyObj<AppInsightsLogger>;
    let router: Router;

    beforeEach(() => {
        appInsightsLogger = jasmine.createSpyObj('AppInsightsLogger', ['trackPage']);

        TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'component-path', component: MockComponent, children: [{ path: 'sub-component', component: MockComponent }] }
                ]),
                StubModule
            ],
            providers: [PageTrackerService, { provide: AppInsightsLogger, useValue: appInsightsLogger }]
        });

        router = TestBed.inject(Router);
        pageTrackerService = TestBed.inject(PageTrackerService);
        pageTrackerService.trackNavigation(router);
    });

    it('should log page on routing', fakeAsync(() => {
        router.initialNavigation();
        router.navigate(['component-path']);
        tick();
        expect(appInsightsLogger.trackPage).toHaveBeenCalledWith('MockComponent /component-path', '/component-path');
    }));

    it('should log page with child on routing', fakeAsync(() => {
        router.initialNavigation();
        router.navigate(['component-path/sub-component']);
        tick();

        const expectedPageName = 'MockComponent /component-path/sub-component';
        const expectedPageUrl = '/component-path/sub-component';
        expect(appInsightsLogger.trackPage).toHaveBeenCalledWith(expectedPageName, expectedPageUrl);
    }));
});
