import { ElementRef } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { CopySipComponent } from './copy-sip.component';

describe('CopySipComponent', () => {
  let component: CopySipComponent;
  let mouseEvent: MouseEvent;
  let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
  let sipAddress: HTMLDivElement;

  beforeAll(() => {
    mouseEvent = document.createEvent('MouseEvent');
    mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
    clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
    clipboardServiceSpy.copyFromContent.and.returnValue(true);
  });

  beforeEach(() => {
    component = new CopySipComponent(clipboardServiceSpy);
    component.ngOnInit();
    sipAddress = document.createElement('div');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should hide the tooltip on mouse out event', () => {
    component.onMouseOut();
    expect(component.displayTooltip).toBe(true);
  });
  it('should show the tooltip on mouse over event', () => {
    component.sipAddress = new ElementRef(sipAddress);
    component.onMouseOver(mouseEvent);

    const expectedTop = mouseEvent.clientY + 15 + 'px';
    const expectedLeft = mouseEvent.clientX + 20 + 'px';
    expect(sipAddress.style.top).toBe(expectedTop);
    expect(sipAddress.style.left).toBe(expectedLeft);

    expect(component.displayTooltip).toBe(false);
    expect(component.tooltip).toBe('Copy address');
  });
  it('should not show tooltip if element if not ready', () => {
    component.sipAddress = null;
    component.displayTooltip = true;
    component.onMouseOver(mouseEvent);

    expect(component.displayTooltip).toBeTruthy();
  });
  it('should copy the endpoint sip address and pin to the clipboard', () => {
    const endpoint = new EndpointModel();
    endpoint.sip = '12345@12345';
    endpoint.pin = '3000';
    component.copyToClipboard(endpoint);
    const address = endpoint.sip + ':' + endpoint.pin;
    expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(address);
    expect(component.displayTooltip).toBe(false);
    expect(component.tooltip).toBe('Address copied to clipboard');
  });
});
