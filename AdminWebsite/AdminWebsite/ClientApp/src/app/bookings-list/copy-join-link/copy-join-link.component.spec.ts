import { DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClipboardService } from 'ngx-clipboard';
import { ConfigService } from '../../services/config.service';
import { CopyJoinLinkComponent } from './copy-join-link.component';

describe('CopyJoinLinkComponent', () => {
    let component: CopyJoinLinkComponent;
    let fixture: ComponentFixture<CopyJoinLinkComponent>;
    let debugElement: DebugElement;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let element: HTMLDivElement;
    let mouseEvent: MouseEvent;
    const vh_video_uri = 'vh-video-web';

    element = document.createElement('div');
    clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
    clipboardServiceSpy.copyFromContent.and.returnValue(true);
    configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getConfig']);
    configServiceSpy.getConfig.and.returnValue(vh_video_uri);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [CopyJoinLinkComponent],
            providers: [
                { provide: ClipboardService, useValue: clipboardServiceSpy },
                { provide: ConfigService, useValue: configServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);

        fixture = TestBed.createComponent(CopyJoinLinkComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should hide the tooltip on mouse out event', () => {
        component.onMouseOut();
        expect(component.displayTooltip).toBe(true);
    });

    it('should show the tooltip on mouse over event', () => {
        component.conferenceJoinByLink = new ElementRef<HTMLDivElement>(element);
        component.onMouseOver(mouseEvent);

        const expectedTop = mouseEvent.clientY + 15 + 'px';
        const expectedLeft = mouseEvent.clientX + 20 + 'px';
        expect(element.style.top).toBe(expectedTop);
        expect(element.style.left).toBe(expectedLeft);

        expect(component.displayTooltip).toBe(false);
        expect(component.tooltip).toBe(component.tooltipTextCopy);
    });

    it('should not show tooltip if element if not ready', () => {
        component.elem = null;
        component.displayTooltip = true;
        component.onMouseOver(mouseEvent);

        expect(component.displayTooltip).toBe(false);
    });

    it('should copy the join link to the clipboard', () => {
        const joinLinkDetails = 'vh-video-web';
        component._detailsToCopy = joinLinkDetails;
        component.copyToClipboard();
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(joinLinkDetails);
        expect(component.displayTooltip).toBe(false);
        expect(component.tooltip).toBe(component.tooltipTextCopied);
    });

    it('includes the text quickjoin in the link', () => {
        component.quickLinkDetails = 'some-id';
        expect(component._detailsToCopy).toContain('quickjoin');
    });
});
