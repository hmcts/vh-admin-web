import { Component } from '@angular/core';
import { faCircleExclamation, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup } from '@angular/forms';
import { JusticeUserResponse } from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { Logger } from '../../services/logger';
import { JusticeUsersService } from '../../services/justice-users.service';

@Component({
    selector: 'app-manage-team',
    templateUrl: './manage-team.component.html',
    styleUrls: ['./manage-team.component.scss']
})
export class ManageTeamComponent {
    private filterSize = 20;

    constructor(private fb: FormBuilder, private justiceUserService: JusticeUsersService, private logger: Logger) {
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

    searchUsers() {
        const term = this.form.value.inputSearch;
        this.errorMessage = false;
        this.displayAddButton = false;
        this.displayMessage = false;
        this.message = '';
        this.isEditing = false;
        this.justiceUserService.retrieveJusticeUserAccounts(term).subscribe(
            (data: JusticeUserResponse[]) => {
                this.users = data;
                this.logger.debug(`${this.loggerPrefix} Updating list of users.`, { users: data.length });
                if (this.users.length > this.filterSize) {
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

    handleListError(err, type) {
        this.logger.error(`${this.loggerPrefix} Error getting ${type} list`, err, type);
        this.error = true;
    }
}
