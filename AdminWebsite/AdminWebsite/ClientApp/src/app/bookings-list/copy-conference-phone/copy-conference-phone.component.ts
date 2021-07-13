import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { CopyDetailsBase } from '../component/copy-details-base';

@Component({
    selector: 'app-copy-conference-phone',
    templateUrl: './copy-conference-phone.component.html',
    styleUrls: ['./copy-conference-phone.component.scss']
})
export class CopyConferencePhoneComponent extends CopyDetailsBase implements OnInit {
    @Input() set phoneConferenceDetails(value: string) {
        this._detailsToCopy = value;
    }
    @ViewChild('conferencePhone', { static: false }) conferencePhone: ElementRef;

    constructor(protected clipboardService: ClipboardService) {
        super(clipboardService);
    }

    ngOnInit(): void {
        this.hideTooltip = true;
        this.tooltipTextCopy = 'Copy details';
        this.tooltip = this.tooltipTextCopy;
        this.tooltipTextCopied = 'Details copied to clipboard';
    }

    onMouseOver($event: MouseEvent): void {
        if (!this.conferencePhone) {
            return;
        }
        this.elem = this.conferencePhone.nativeElement as HTMLDivElement;
        this.mouseOver($event);
    }
}
