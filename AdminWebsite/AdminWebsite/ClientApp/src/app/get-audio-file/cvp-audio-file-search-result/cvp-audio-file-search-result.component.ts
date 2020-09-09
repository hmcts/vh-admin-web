import { Component, Input } from '@angular/core';
import { CvpAudioSearchModel } from '../../common/model/cvp-audio-search-model';
import { ClipboardService } from 'ngx-clipboard';

@Component({
    selector: 'app-cvp-audio-file-search-result',
    templateUrl: './cvp-audio-file-search-result.component.html',
    styleUrls: ['./cvp-audio-file-search-result.component.scss']
})
export class CvpAudioFileSearchResultComponent {
    @Input() results: CvpAudioSearchModel[];


    constructor(private clipboardService: ClipboardService) { }

    get hasResults() {
        return this.results && this.results.length > 0;
    }

    async onCopyLinkClick(i: number) {
        const result = this.results[i];
        this.clipboardService.copyFromContent(result.sasTokenUri);
        result.selected = true;
        setTimeout(() => this.hideLinkCopiedMessage(), 3000);
    }

    hideLinkCopiedMessage() {
        this.results.forEach(x => { x.selected = false; })
    }
}
