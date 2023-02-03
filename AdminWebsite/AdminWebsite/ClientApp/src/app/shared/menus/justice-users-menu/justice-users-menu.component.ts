import { Component, EventEmitter, Output } from '@angular/core';
import { JusticeUserResponse } from '../../../services/clients/api-client';
import { FormBuilder } from '@angular/forms';
import { BookingPersistService } from '../../../services/bookings-persist.service';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { Logger } from '../../../services/logger';
import { MenuBase } from '../menu-base';

@Component({
    selector: 'app-justice-users-menu',
    templateUrl: './justice-users-menu.component.html',
    styleUrls: ['./justice-users-menu.component.scss']
})
export class JusticeUsersMenuComponent extends MenuBase {
    loggerPrefix = '[MenuJusticeUser] -';
    formGroupName = 'selectedUserIds';
    users: JusticeUserResponse[];
    selectedItems: [];
    formConfiguration = {
        selectedUserIds: [this.bookingPersistService.selectedUsers || []]
    };

    @Output() selectedEmitter = new EventEmitter<string[]>();

    constructor(
        private bookingPersistService: BookingPersistService,
        private videoHearingService: VideoHearingsService,
        formBuilder: FormBuilder,
        logger: Logger
    ) {
        super(formBuilder, logger);
    }

    loadItems(): void {
        this.videoHearingService.getUsers(null).subscribe(
            (data: JusticeUserResponse[]) => {
                this.users = data;
                this.logger.debug(`${this.loggerPrefix} Updating list of users.`, { users: data.length });
            },
            error => {
                this.handleListError(error, 'users');
            }
        );
    }
}
