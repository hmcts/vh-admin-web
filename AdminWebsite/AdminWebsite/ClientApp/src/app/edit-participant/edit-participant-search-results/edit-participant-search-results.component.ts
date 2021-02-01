import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-edit-participant-search-results',
    templateUrl: './edit-participant-search-results.component.html',
    styleUrls: ['./edit-participant-search-results.component.scss']
})
export class EditParticipantSearchResultsComponent {
    private readonly loggerPrefix = '[EditParticipant] -';
    @Input() contactEmail: string;
    @Input() result: ParticipantEditResultModel;
    constructor(private router: Router) {}

    get userNotFound() {
        return this.result === null;
    }

    editParticipant() {
        this.router.navigateByUrl(PageUrls.EditParticipant);
    }
}
