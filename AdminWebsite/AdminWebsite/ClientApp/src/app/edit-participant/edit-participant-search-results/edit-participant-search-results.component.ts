import { Component, Input } from '@angular/core';
import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';

@Component({
    selector: 'app-edit-participant-search-results',
    templateUrl: './edit-participant-search-results.component.html',
    styleUrls: ['./edit-participant-search-results.component.scss']
})
export class EditParticipantSearchResultsComponent {
    private readonly loggerPrefix = '[EditParticipant] -';
    @Input() contactEmail: string;
    @Input() result: ParticipantEditResultModel;
    constructor() {}

    get userNotFound() {
        return this.result === null;
    }
}
