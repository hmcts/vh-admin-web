import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { ClipboardService } from 'ngx-clipboard';

@Component({
    selector: 'app-copy-sip',
    templateUrl: './copy-sip.component.html',
    styleUrls: ['./copy-sip.component.scss']
})
export class CopySipComponent implements OnInit {
    @Input() endpoint: EndpointModel;
    displayTooltip: boolean;
    tooltip: string;
    @ViewChild('sipAddress', { static: false }) sipAddress: ElementRef;

    constructor(private clipboardService: ClipboardService) {}

    ngOnInit(): void {
        this.displayTooltip = true;
        this.tooltip = 'Copy address';
    }

    onMouseOver($event: MouseEvent): void {
        if (!this.sipAddress) {
            return;
        }
        const x = $event.clientX;
        const y = $event.clientY;
        const elem = this.sipAddress.nativeElement as HTMLDivElement;

        elem.style.top = y + 15 + 'px';
        elem.style.left = x + 20 + 'px';
        this.setTooltipVisibility(false);
    }

    copyToClipboard(endpoint: EndpointModel) {
        const address = endpoint.sip + ':' + endpoint.pin;
        this.clipboardService.copyFromContent(address);
        this.tooltip = 'Address copied to clipboard';
        this.setTooltipVisibility(false);
    }

    onMouseOut(): void {
        this.setTooltipVisibility(true);
    }

    setTooltipVisibility(visible: boolean) {
        this.displayTooltip = visible;
    }
}
