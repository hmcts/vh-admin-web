import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { ClipboardService } from 'ngx-clipboard';
import { CopyDetailsBase } from '../component/copy-details-base';

@Component({
    selector: 'app-copy-sip',
    templateUrl: './copy-sip.component.html',
    styleUrls: ['./copy-sip.component.scss']
})
export class CopySipComponent extends CopyDetailsBase implements OnInit {
    @Input() set endpoint(value: EndpointModel) {
        if (value) {
            this._detailsToCopy = value.sip + ':' + value.pin;
        }
    };
    displayTooltip: boolean;
    tooltip: string;
    @ViewChild('sipAddress', { static: false }) sipAddress: ElementRef;

    constructor(protected clipboardService: ClipboardService) {
        super(clipboardService);
    }

    ngOnInit(): void {
        this.displayTooltip = true;
        this.tooltipTextCopy = 'Copy address';
        this.tooltip = this.tooltipTextCopy;
        this.tooltipTextCopied = 'Address copied to clipboard';
    }

    onMouseOver($event: MouseEvent): void {
        if (!this.sipAddress) {
            return;
        }
        this.elem = this.sipAddress.nativeElement as HTMLDivElement;
        this.mouseOver($event);
    }
}
