import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { CopyConferencePhoneComponent } from './copy-conference-phone.component';

describe('CopyConferencePhoneComponent', () => {
    let fixture: ComponentFixture<CopyConferencePhoneComponent>;
    let debugElement: DebugElement;
    let component: CopyConferencePhoneComponent;
    let mouseEvent: MouseEvent;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
    let element: HTMLDivElement;

    element = document.createElement('div');
    clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
    clipboardServiceSpy.copyFromContent.and.returnValue(true);

    beforeEach(
        async() => {
           await TestBed.configureTestingModule({
                imports: [],
                declarations: [CopyConferencePhoneComponent],
                providers: [
                    { provide: ClipboardService, useValue: clipboardServiceSpy }
                ]
            }).compileComponents();        
    });

    beforeEach(() => {

        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);

        fixture = TestBed.createComponent(CopyConferencePhoneComponent);
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
        component.conferencePhone = new ElementRef<HTMLDivElement>(element);
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
    it('should copy the phone number and phone conference id to the clipboard', () => {
        const phoneDetails = '0000 111 2222 (ID: 1234)';
        component._detailsToCopy = phoneDetails;
        component.copyToClipboard();
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(phoneDetails);
        expect(component.displayTooltip).toBe(false);
        expect(component.tooltip).toBe(component.tooltipTextCopied);
    });
});
