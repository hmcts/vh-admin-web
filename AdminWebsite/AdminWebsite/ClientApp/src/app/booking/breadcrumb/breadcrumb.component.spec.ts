import { Router } from '@angular/router';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BreadcrumbComponent } from './breadcrumb.component';
import { BreadcrumbItemModel } from './breadcrumbItem.model';

describe('BreadcrumbComponent', () => {
    const videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['validCurrentRequest', 'isConferenceClosed', 'isHearingAboutToStart']);

    let component: BreadcrumbComponent;
    const router = {
        url: '/hearing-schedule',
        ...jasmine.createSpyObj<Router>(['navigate'])
    } as jasmine.SpyObj<Router>;

    beforeEach(() => {
        component = new BreadcrumbComponent(router, videoHearingsServiceSpy);
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
        expect(component.currentItem instanceof BreadcrumbItemModel).toBeTruthy();
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
        const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/hearing-schedule', false);
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should not navigate to next route if the difference between next item id and the current is greater than 1', () => {
        component.canNavigate = false;
        const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/assign-judge', false);
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should not navigate to next route if the next item with the given url is not found', () => {
        component.canNavigate = false;
        const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/some-thing', false);
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should navigate to next route if canNavigate set to true and next item in correct order', () => {
        const step = new BreadcrumbItemModel(2, false, 'Hearing schedule', '/assign-judge', false);
        component.clickBreadcrumbs(step);
        expect(router.navigate).toHaveBeenCalledWith(['/assign-judge']);
    });
});
