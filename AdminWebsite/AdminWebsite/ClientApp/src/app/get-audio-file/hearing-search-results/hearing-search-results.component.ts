import { Component, Input, OnInit } from '@angular/core';
import { HearingAudioSearchModel } from '../../common/model/hearing-audio-search-model';

@Component({
    selector: 'app-hearing-search-results',
    templateUrl: './hearing-search-results.component.html',
    styleUrls: ['./hearing-search-results.component.scss']
})
export class HearingSearchResultsComponent implements OnInit {
    @Input() results: HearingAudioSearchModel[];
    async ngOnInit(): Promise<void> {}
    get hasResults() {
        return this.results && this.results.length > 0;
    }
}
