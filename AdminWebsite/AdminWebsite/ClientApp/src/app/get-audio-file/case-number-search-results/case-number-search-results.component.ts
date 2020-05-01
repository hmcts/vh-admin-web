import { Component, Input, OnInit } from '@angular/core';
import { CaseNumberSearchResultModel } from '../../common/model/case-number-search-result.model';

@Component({
    selector: 'app-case-number-search-results',
    templateUrl: './case-number-search-results.component.html'
    // styleUrls: ['./participant-status.component.scss']
})
export class CaseNumberSearchResultsComponent implements OnInit {
    @Input() results: CaseNumberSearchResultModel[];
    async ngOnInit(): Promise<void> {}
    get hasResults() {
        return this.results && this.results.length > 0;
    }
}
