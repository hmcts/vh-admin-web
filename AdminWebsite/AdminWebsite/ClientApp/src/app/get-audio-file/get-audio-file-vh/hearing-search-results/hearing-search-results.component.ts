import { Component, Input } from '@angular/core';
import { HearingAudioSearchModel } from 'src/app/common/model/hearing-audio-search-model';

@Component({
    selector: 'app-hearing-search-results',
    templateUrl: './hearing-search-results.component.html',
    styleUrls: ['./hearing-search-results.component.scss'],
    standalone: false
})
export class HearingSearchResultsComponent {
    @Input() results: HearingAudioSearchModel[];

    get hasResults() {
        return this.results && this.results.length > 0;
    }
}
