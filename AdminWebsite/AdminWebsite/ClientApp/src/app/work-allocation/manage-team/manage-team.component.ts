import { Component, ElementRef, OnInit } from '@angular/core';
import { faCircleExclamation, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JusticeUserResponse } from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { Logger } from '../../services/logger';

@Component({
    selector: 'app-manage-team',
    templateUrl: './manage-team.component.html',
    styleUrls: ['./manage-team.component.scss']
})
export class ManageTeamComponent {
    private filterSize = 20;

    constructor(
        private fb: FormBuilder,
        private videoHearingService: VideoHearingsService,
        private logger: Logger,
        private elRef: ElementRef
    ) {
        this.form = fb.group({
            inputSearch: ['']
        });
    }

    loggerPrefix = '[ManageTeamComponent] -';
    displayMessage = false;
    faExclamation = faCircleExclamation;
    faError = faExclamationCircle;
    message: string;
    users: JusticeUserResponse[];
    form: FormGroup;
    isEditing = false;
    isSaving = false;
    error = false;
    displayAddButton = false;
    errorMessage = false;

    editUser(id) {
        // TODO: edit will enable all the inputs in a row.
        // const row = this.elRef.nativeElement.getElementsByClassName(id) as HTMLCollection;
        // for (let i = 0; i < row.length; i++) {
        //     (<HTMLElement>row[i]).removeAttribute('disabled');
        // }
    }

    deleteUser(id) {}

    searchUsers() {
        const term = this.form.value.inputSearch;
        this.errorMessage = false;
        this.displayAddButton = false;
        this.displayMessage = false;
        this.message = '';
        this.isEditing = false;
        this.videoHearingService.getUsers(term).subscribe(
            (data: JusticeUserResponse[]) => {
                this.users = data;
                this.logger.debug(`${this.loggerPrefix} Updating list of users.`, { users: data.length });
                if (this.users.length > 20) {
                    this.users = this.users.slice(0, this.filterSize);
                    this.displayMessage = true;
                    this.message = `Only the first ${this.filterSize} results are shown, please refine your search to see more results.`;
                } else if (this.users.length === 0) {
                    this.displayMessage = true;
                    this.errorMessage = true;
                    this.message =
                        'No users matching this search criteria were found. ' +
                        'Please check the search and try again. Or, add the team member.';
                }
                this.displayAddButton = true;
            },
            error => {
                this.handleListError(error, 'users');
            }
        );
    }

    addUsers() {}

    handleListError(err, type) {
        this.logger.error(`${this.loggerPrefix} Error getting ${type} list`, err, type);
        this.error = true;
    }
}
