import { DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClipboardService } from 'ngx-clipboard';
import { ClientSettingsResponse } from 'src/app/services/clients/api-client';
import { ConfigService } from '../../services/config.service';
import { CopyJoinLinkComponent } from './copy-join-link.component';

describe('CopyJoinLinkComponent', () => {
    let component: CopyJoinLinkComponent;
    let fixture: ComponentFixture<CopyJoinLinkComponent>;
    let debugElement: DebugElement;
    let mouseEvent: MouseEvent;
    const vh_video_uri = 'vh-video-web';
    const clientSettingsResponse = new ClientSettingsResponse();
    clientSettingsResponse.video_web_url = vh_video_uri;

    const element = document.createElement('div');
    const clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
    clipboardServiceSpy.copyFromContent.and.returnValue(true);
    const configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', {
        getConfig: clientSettingsResponse
    });

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
        const hearingId = 'hearing-id';
        component.quickLinkDetails = hearingId;
        expect(component._detailsToCopy).toBe(`${vh_video_uri}quickjoin/${hearingId}`);
    });
});
