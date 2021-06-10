import { Component, Input } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { CvpAudioSearchModel } from 'src/app/common/model/cvp-audio-search-model';
import { ICvpAudioRecordingResult } from 'src/app/services/audio-link-service';
import { Logger } from 'src/app/services/logger';

@Component({
    selector: 'app-cvp-audio-file-search-result',
    templateUrl: './cvp-audio-file-search-result.component.html',
    styleUrls: ['./cvp-audio-file-search-result.component.scss']
})
export class CvpAudioFileSearchResultComponent {
    private readonly loggerPrefix = '[CvpAudioFileSearchResult] -';

    @Input() results: CvpAudioSearchModel[];

    constructor(private clipboardService: ClipboardService, private logger: Logger) {}

    get hasResults() {
        return this.results && this.results.length > 0;
    }

    async onCopyLinkClick(i: number) {
        const result = this.results[i];
        this.logger.debug(`${this.loggerPrefix} Copying audio link`, { filename: result.fileName });
        this.clipboardService.copyFromContent(result.sasTokenUri);
        result.selected = true;
        setTimeout(() => this.hideLinkCopiedMessage(), 3000);
    }

    hideLinkCopiedMessage() {
        this.results.forEach(x => {
            x.selected = false;
        });
    }
}
