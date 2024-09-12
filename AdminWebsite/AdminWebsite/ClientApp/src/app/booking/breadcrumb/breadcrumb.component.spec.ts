import { Router } from '@angular/router';
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

    beforeEach(() => {
        component = new BreadcrumbComponent(router, videoHearingsServiceSpy);
        component.breadcrumbItems = BreadcrumbItems.slice();
        component.canNavigate = true;
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should create breadcrumb component', () => {
        expect(component).toBeTruthy();
    });

    it('should have predefine navigation items', () => {
        expect(component.breadcrumbItems.length).toBeGreaterThan(0);
    });

    it('should match the current route and be type BreadcrumbItemModel', () => {
        expect(component.currentRouter).toEqual('/hearing-schedule');
        expect(component.currentItem.Url).toEqual(component.currentRouter);
        expect(component.currentItem instanceof BreadcrumbItemModel).toBeTruthy();
    });

    it('should have property Active set to true and property Value set to true for currentItem', () => {
        expect(component.currentItem.Active).toBeTruthy();
        expect(component.currentItem.Value).toBeTruthy();
    });

    it('should have property Active set to false and property Value set to false for next items', () => {
        for (const item of component.breadcrumbItems) {
            if (item.Url !== component.currentItem.Url && item.Id > component.currentItem.Id) {
                expect(item.Active).toBeFalsy();
                expect(item.Value).toBeFalsy();
            }
        }
    });

    it('should have property Active set to true and property Value set to false for previous items', () => {
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
        const step = BreadcrumbItems[BreadcrumbItems.length - 1];
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledTimes(0);
        expect(videoHearingsServiceSpy.validCurrentRequest).not.toHaveBeenCalled();
    });

    it('should not navigate to next route if the next item with the given url is not found', () => {
        component.canNavigate = true;
        const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/some-thing', false, false);
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should unsubscribe from subscriptions when ngOnDestroy is called', () => {
        spyOn(component.destroyed$, 'next');
        spyOn(component.destroyed$, 'complete');
        component.ngOnDestroy();
        expect(component.destroyed$.next).toHaveBeenCalled();
        expect(component.destroyed$.complete).toHaveBeenCalled();
    });
});
