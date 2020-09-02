import { Component, Input } from '@angular/core';
import { ParticipantHearingDeleteResultModel } from 'src/app/common/model/participant-hearing-delete-result-model';

@Component({
    selector: 'app-delete-participant-search-results',
    templateUrl: './delete-participant-search-results.component.html',
    styleUrls: ['./delete-participant-search-results.component.scss']
})
export class DeleteParticipantSearchResultsComponent {
    @Input() results: ParticipantHearingDeleteResultModel[];

    get hasResults() {
        return this.results && this.results.length > 0;
    }

    get userNotFound() {
        return !this.results || this.results.length === 0;
    }
}
