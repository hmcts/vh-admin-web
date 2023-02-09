import { Component, EventEmitter, Input, Output } from '@angular/core';
import { JusticeUserResponse } from '../../../services/clients/api-client';
import { FormBuilder } from '@angular/forms';
import { BookingPersistService } from '../../../services/bookings-persist.service';
import { JusticeUsersService } from '../../../services/justice-users.service';
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
    selectedItems: [] | string;
    formConfiguration = {
        selectedUserIds: [this.bookingPersistService.selectedUsers || []]
    };

    @Output() selectedEmitter = new EventEmitter<string[] | string>();
    @Input() dropDownLabel = 'Allocated CSO';
    @Input() multiSelect = true;
    constructor(
        private bookingPersistService: BookingPersistService,
        private justiceUserService: JusticeUsersService,
        formBuilder: FormBuilder,
        logger: Logger
    ) {
        super(formBuilder, logger);
    }

    loadItems(): void {
        this.justiceUserService.retrieveJusticeUserAccounts(null).subscribe(
            (data: JusticeUserResponse[]) => {
                this.users = data;
                this.items = data;
                this.logger.debug(`${this.loggerPrefix} Updating list of users.`, { users: data.length });
            },
            error => this.handleListError(error, 'users')
        );
    }
}
