import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { JusticeUserResponse } from '../../../services/clients/api-client';
import { FormBuilder } from '@angular/forms';
import { BookingPersistService } from '../../../services/bookings-persist.service';
import { JusticeUsersService } from '../../../services/justice-users.service';
import { Logger } from '../../../services/logger';
import { MenuBase } from '../menu-base';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-justice-users-menu',
    templateUrl: './justice-users-menu.component.html',
    styleUrls: ['./justice-users-menu.component.scss']
})
export class JusticeUsersMenuComponent extends MenuBase implements OnInit {
    loggerPrefix = '[MenuJusticeUser] -';
    formGroupName = 'selectedUserIds';
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

    ngOnInit(): void {
        this.justiceUserService.allUsers$
            .pipe(map(users => users.filter(user => !user.deleted)))
            .subscribe((data: JusticeUserResponse[]) => {
                this.items = data;
            });
        super.ngOnInit();
    }

    loadItems(): void {}
}
