import { ElementRef } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { CopyConferencePhoneComponent } from './copy-conference-phone.component';

describe('CopyConferencePhoneComponent', () => {
    let component: CopyConferencePhoneComponent;
    let mouseEvent: MouseEvent;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
    let element: HTMLDivElement;

    beforeAll(() => {
        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
        clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
        clipboardServiceSpy.copyFromContent.and.returnValue(true);
    });

    beforeEach(() => {
        component = new CopyConferencePhoneComponent(clipboardServiceSpy);
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
        component.conferencePhone = new ElementRef<HTMLDivElement>(element);
        component.onMouseOver(mouseEvent);

        const expectedTop = mouseEvent.clientY + 15 + 'px';
        const expectedLeft = mouseEvent.clientX + 20 + 'px';
        expect(element.style.top).toBe(expectedTop);
        expect(element.style.left).toBe(expectedLeft);

        expect(component.hideTooltip).toBe(true);
        expect(component.tooltip).toBe(component.tooltipTextCopy);
    });
    it('should not show tooltip if element if not ready', () => {
        component.elem = null;
        component.hideTooltip = true;
        component.onMouseOver(mouseEvent);

        expect(component.hideTooltip).toBeTruthy();
    });
    it('should copy the phone number and phone conference id to the clipboard', () => {
        const phoneDetails = '0000 111 2222 (ID: 1234)';
        component._detailsToCopy = phoneDetails;
        component.copyToClipboard();
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(phoneDetails);
        expect(component.hideTooltip).toBe(false);
        expect(component.tooltip).toBe(component.tooltipTextCopied);
    });
});
