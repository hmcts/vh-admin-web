import { ElementRef } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { CopyJoinLinkComponent } from './copy-join-link.component';
import { ConfigService } from '../../services/config.service';

describe('CopyJoinLinkComponent', () => {
    let component: CopyJoinLinkComponent;
    let mouseEvent: MouseEvent;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
    let element: HTMLDivElement;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;

    const vh_video_uri = 'vh-video-web';

    beforeAll(() => {
        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
        clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
        clipboardServiceSpy.copyFromContent.and.returnValue(true);

        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getConfig']);
        configServiceSpy.getConfig.and.returnValue(vh_video_uri);
    });

    beforeEach(() => {
        component = new CopyJoinLinkComponent(clipboardServiceSpy, configServiceSpy);
        component.ngOnInit();
        element = document.createElement('div');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should hide the tooltip on mouse out event', () => {
        component.onMouseOut();
        expect(component.hideTooltip).toBe(true);
    });
    it('should show the tooltip on mouse over event', () => {
        component.conferenceJoinByLink = new ElementRef<HTMLDivElement>(element);
        component.onMouseOver(mouseEvent);

        const expectedTop = mouseEvent.clientY + 15 + 'px';
        const expectedLeft = mouseEvent.clientX + 20 + 'px';
        expect(element.style.top).toBe(expectedTop);
        expect(element.style.left).toBe(expectedLeft);

        expect(component.hideTooltip).toBe(false);
        expect(component.tooltip).toBe(component.tooltipTextCopy);
    });
    it('should not show tooltip if element if not ready', () => {
        component.elem = null;
        component.hideTooltip = true;
        component.onMouseOver(mouseEvent);

        expect(component.hideTooltip).toBeTruthy();
    });
    it('should copy the join link to the clipboard', () => {
        const joinLinkDetails = 'vh-video-web';
        component._detailsToCopy = joinLinkDetails;
        component.copyToClipboard();
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(joinLinkDetails);
        expect(component.hideTooltip).toBe(false);
        expect(component.tooltip).toBe(component.tooltipTextCopied);
    });
});
