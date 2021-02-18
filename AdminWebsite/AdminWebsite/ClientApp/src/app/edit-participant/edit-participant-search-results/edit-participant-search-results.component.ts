import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';
import { ParticipantEditService } from 'src/app/services/participant-edit-service.service';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-edit-participant-search-results',
    templateUrl: './edit-participant-search-results.component.html',
    styleUrls: ['./edit-participant-search-results.component.scss']
})
export class EditParticipantSearchResultsComponent {
    @Input() contactEmail: string;
    @Input() result: ParticipantEditResultModel;
    @Input() isUnauthorisedSearch: boolean;
    constructor(private service: ParticipantEditService, private router: Router) {}

    get userNotFound() {
        return this.result === null;
    }

    get warningText(): string {
        // tslint:disable-next-line: quotemark
        return this.isUnauthorisedSearch ? 'Judge accounts cannot be edited' : "Sorry, we can't find a user with that email address.";
    }

    editParticipant() {
        this.service.assignParticipantToEdit(this.result);
        this.router.navigateByUrl(PageUrls.EditParticipant);
    }
}
