import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-cvp-audio-file-search-result',
    templateUrl: './cvp-audio-file-search-result.component.html',
    styleUrls: ['./cvp-audio-file-search-result.component.scss']
})
export class CvpAudioFileSearchResultComponent {
    @Input() results: string[];

    get hasResults() {
        return this.results && this.results.length > 0;
    }
}
