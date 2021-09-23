import { Router } from '@angular/router';
import { of } from 'rxjs';
import { FeatureFlagService } from 'src/app/services/feature-flag.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BreadcrumbComponent } from './breadcrumb.component';
import { BreadcrumbItemModel } from './breadcrumbItem.model';

import { BreadcrumbItems } from './breadcrumbItems';

describe('BreadcrumbComponent', () => {
    const videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>([
        'validCurrentRequest',
        'isConferenceClosed',
        'isHearingAboutToStart'
    ]);

    let component: BreadcrumbComponent;
    const router = {
        url: '/hearing-schedule',
        ...jasmine.createSpyObj<Router>(['navigate'])
    } as jasmine.SpyObj<Router>;
    let featureFlagServiceSpy: jasmine.SpyObj<FeatureFlagService>;

    beforeEach(() => {
        featureFlagServiceSpy = jasmine.createSpyObj<FeatureFlagService>('FeatureToggleService', ['getFeatureFlagByName']);
        featureFlagServiceSpy.getFeatureFlagByName.and.returnValue(of(true));

        component = new BreadcrumbComponent(router, videoHearingsServiceSpy, featureFlagServiceSpy);
        component.canNavigate = true;
        component.ngOnInit();
    });

    it('should create breadcrumb component', () => {
        expect(component).toBeTruthy();
    });

    it('breadcrumb component should have predefine navigation items', () => {
        expect(component.breadcrumbItems.length).toBeGreaterThan(0);
    });

    it('breadcrumb component currentItem should match the current route and be type BreadcrumbItemModel', () => {
        expect(component.currentRouter).toEqual('/hearing-schedule');
        expect(component.currentItem.Url).toEqual(component.currentRouter);
    });

    it('breadcrumb component currentItem should have property Active set to true and property Value set to true', () => {
        expect(component.currentItem.Active).toBeTruthy();
        expect(component.currentItem.Value).toBeTruthy();
    });

    it('next items should have property Active set to false and property Value set to false', () => {
        for (const item of component.breadcrumbItems) {
            if (item.Url !== component.currentItem.Url && item.Id > component.currentItem.Id) {
                expect(item.Active).toBeFalsy();
                expect(item.Value).toBeFalsy();
            }
        }
    });

    it('previous items should have property Active set to true and property Value set to false', () => {
        for (const item of component.breadcrumbItems) {
            if (item.Url !== component.currentItem.Url && item.Id < component.currentItem.Id) {
                expect(item.Active).toBeTruthy();
                expect(item.Value).toBeFalsy();
            }
        }
    });

    it('should not navigate to next route if canNavigate set to false', () => {
        component.canNavigate = false;
        const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/hearing-schedule', false, false);
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledTimes(0);
        expect(videoHearingsServiceSpy.validCurrentRequest).not.toHaveBeenCalled();
    });

    it('should not navigate to next route if the difference between next item id and the current is greater than 1', () => {
        component.canNavigate = false;
        const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/assign-judge', false, false);
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledTimes(0);
        expect(videoHearingsServiceSpy.validCurrentRequest).not.toHaveBeenCalled();
    });

    it('should not navigate to next route if the next item with the given url is not found', () => {
        component.canNavigate = false;
        const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/some-thing', false, false);
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should navigate to next route if canNavigate set to true and next item in correct order', () => {
        const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/assign-judge', false, false);
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledWith(['/assign-judge']);
    });

    it('should set the breadcrumb name for assign-judge as Judge/Staff when staff member feature is ON', () => {
        featureFlagServiceSpy.getFeatureFlagByName.and.returnValue(of(true));
        component.ngOnInit();
        expect(component.breadcrumbItems.find(b => b.Url === PageUrls.AssignJudge).Name).toBe('Judge/Staff');
    });

    it('should set the breadcrumb name for assign-judge as Judge when staff member feature is OFF', () => {
        featureFlagServiceSpy.getFeatureFlagByName.and.returnValue(of(false));
        component.ngOnInit();
        expect(component.breadcrumbItems.find(b => b.Url === PageUrls.AssignJudge).Name).toBe('Judge');
    });

    describe('when other checks fail', () => {
        const route = '/add-participants';
        let step: BreadcrumbItemModel;

        beforeEach(() => {
            step = new BreadcrumbItemModel(3, false, 'Hearing schedule', route, false, false);
            videoHearingsServiceSpy.validCurrentRequest.calls.reset();
            router.navigate.calls.reset();
        });

        it('should not navigate when canNavigate set to true and is not validCurrentRequest', () => {
            videoHearingsServiceSpy.validCurrentRequest.and.returnValue(false);
            component.clickBreadcrumbs(step);
            expect(router.navigate).not.toHaveBeenCalled();
            expect(videoHearingsServiceSpy.validCurrentRequest).toHaveBeenCalledTimes(1);
        });

        it('should navigate to next route if canNavigate set to true and is validCurrentRequest', () => {
            videoHearingsServiceSpy.validCurrentRequest.and.returnValue(true);
            component.clickBreadcrumbs(step);
            expect(router.navigate).toHaveBeenCalledWith([route]);
            expect(videoHearingsServiceSpy.validCurrentRequest).toHaveBeenCalledTimes(1);
        });
    });

    describe('Set correct active', () => {
        const defaultActive = undefined;

        const breadCrumbId1 = 1;
        const breadCrumbValue1 = true;
        const breadCrumbName1 = 'BreadCrumbName1';
        const breadCrumbUrl1 = 'BreadCrumbUrl1';
        const breadCrumbLastMinuteAmendable1 = false;

        const breadCrumb1 = new BreadcrumbItemModel(
            breadCrumbId1,
            breadCrumbValue1,
            breadCrumbName1,
            breadCrumbUrl1,
            defaultActive,
            breadCrumbLastMinuteAmendable1
        );

        const breadCrumbId2 = 2;
        const breadCrumbValue2 = true;
        const breadCrumbName2 = 'BreadCrumbName2';
        const breadCrumbUrl2 = 'BreadCrumbUrl2';
        const breadCrumbLastMinuteAmendable2 = true;

        const breadCrumb2 = new BreadcrumbItemModel(
            breadCrumbId2,
            breadCrumbValue2,
            breadCrumbName2,
            breadCrumbUrl2,
            defaultActive,
            breadCrumbLastMinuteAmendable2
        );

        const breadCrumbId3 = 3;
        const breadCrumbValue3 = true;
        const breadCrumbName3 = 'BreadCrumbName3';
        const breadCrumbUrl3 = 'BreadCrumbUrl3';
        const breadCrumbLastMinuteAmendable3 = false;

        const breadCrumb3 = new BreadcrumbItemModel(
            breadCrumbId3,
            breadCrumbValue3,
            breadCrumbName3,
            breadCrumbUrl3,
            defaultActive,
            breadCrumbLastMinuteAmendable3
        );

        const breadCrumbId4 = 4;
        const breadCrumbValue4 = true;
        const breadCrumbName4 = 'BreadCrumbName4';
        const breadCrumbUrl4 = 'BreadCrumbUrl4';
        const breadCrumbLastMinuteAmendable4 = true;

        const breadCrumb4 = new BreadcrumbItemModel(
            breadCrumbId4,
            breadCrumbValue4,
            breadCrumbName4,
            breadCrumbUrl4,
            defaultActive,
            breadCrumbLastMinuteAmendable4
        );

        const breadCrumbId5 = 5;
        const breadCrumbValue5 = true;
        const breadCrumbName5 = 'BreadCrumbName5';
        const breadCrumbUrl5 = 'BreadCrumbUrl5';
        const breadCrumbLastMinuteAmendable5 = false;

        const breadCrumb5 = new BreadcrumbItemModel(
            breadCrumbId5,
            breadCrumbValue5,
            breadCrumbName5,
            breadCrumbUrl5,
            defaultActive,
            breadCrumbLastMinuteAmendable5
        );

        const breadCrumbs = [breadCrumb1, breadCrumb2, breadCrumb3, breadCrumb4, breadCrumb5];

        beforeAll(() => {
            BreadcrumbItems.splice(0, BreadcrumbItems.length);
            BreadcrumbItems.push(...breadCrumbs);
        });

        it('if currentRouter does not match any breadcrumbs, all breadcrumbs.active should not change', () => {
            // @ts-ignore: force this readonly property value for testing.
            router.url = 'NoMatches';
            component.ngOnInit();

            component.breadcrumbItems.map(item => {
                expect(item.Active).toBe(defaultActive);
            });
        });

        describe('currentRouter matches a breadcrumb', () => {
            const activeIndex = 2;
            beforeEach(() => {
                // @ts-ignore: force this readonly property value for testing.
                router.url = breadCrumbs[activeIndex].Url;
            });

            it('ensure all test cases are covered', () => {
                expect(breadCrumbs.some(breadCrumb => breadCrumb.Id < breadCrumbs[activeIndex].Id && breadCrumb.LastMinuteAmendable)).toBe(
                    true
                );
                expect(breadCrumbs.some(breadCrumb => breadCrumb.Id < breadCrumbs[activeIndex].Id && !breadCrumb.LastMinuteAmendable)).toBe(
                    true
                );
                expect(breadCrumbs.some(breadCrumb => breadCrumb.Id > breadCrumbs[activeIndex].Id && breadCrumb.LastMinuteAmendable)).toBe(
                    true
                );
                expect(breadCrumbs.some(breadCrumb => breadCrumb.Id > breadCrumbs[activeIndex].Id && !breadCrumb.LastMinuteAmendable)).toBe(
                    true
                );
            });

            describe('when not last minute amendment', () => {
                describe('conference closed', () => {
                    beforeEach(() => {
                        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
                    });

                    it('only ids before current router should be active', () => {});
                });

                describe('hearing not about to start', () => {
                    beforeEach(() => {
                        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
                    });

                    it('only ids before current router should be active', () => {});
                });

                describe('conference close adn hearing not about to start', () => {
                    beforeEach(() => {
                        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
                        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
                    });

                    it('only ids before current router should be active', () => {});
                });

                afterEach(() => {
                    component.ngOnInit();
                    for (let i = 0; i < breadCrumbs.length; i++) {
                        expect(breadCrumbs[i].Active).toBe(breadCrumbs[i].Id <= breadCrumbs[activeIndex].Id);
                    }
                });
            });

            describe('when last minute amendment', () => {
                beforeEach(() => {
                    videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
                    videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
                });

                it('only ids before current router and marked as lastMinuteAmendable should be active', () => {
                    component.ngOnInit();
                    for (let i = 0; i < breadCrumbs.length; i++) {
                        const currentBreadCrumb = breadCrumbs[i];

                        expect(currentBreadCrumb.Active).toBe(
                            currentBreadCrumb.Id <= breadCrumbs[activeIndex].Id && currentBreadCrumb.LastMinuteAmendable
                        );
                    }
                });
            });
        });
    });
});
