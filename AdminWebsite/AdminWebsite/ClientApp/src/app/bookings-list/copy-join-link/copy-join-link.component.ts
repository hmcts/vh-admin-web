import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { CopyDetailsBase } from '../component/copy-details-base';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ConfigService } from '../../services/config.service';

@Component({
    selector: 'app-copy-join-link',
    templateUrl: './copy-join-link.component.html',
    styleUrls: ['./copy-join-link.component.scss']
})
export class CopyJoinLinkComponent extends CopyDetailsBase implements OnInit {
    @Input() set quickLinkDetails(value: string) {
        this._detailsToCopy = this.vh_video_uri + [PageUrls.JoinLink] + '/' + value;
    }
    @ViewChild('conferenceJoinByLink', { static: false }) conferenceJoinByLink: ElementRef;

    private readonly vh_video_uri: string;

    constructor(protected clipboardService: ClipboardService, private configService: ConfigService) {
        super(clipboardService);
        this.vh_video_uri = this.configService.getConfig().video_web_url;
    }

    ngOnInit(): void {
        this.displayTooltip = true;
        this.tooltipTextCopy = 'Copy details';
        this.tooltip = this.tooltipTextCopy;
        this.tooltipTextCopied = 'Details copied to clipboard';
    }

    onMouseOver($event: MouseEvent): void {
        if (!this.conferenceJoinByLink) {
            return;
        }
        this.elem = this.conferenceJoinByLink.nativeElement as HTMLDivElement;
        this.mouseOver($event);
    }
}
