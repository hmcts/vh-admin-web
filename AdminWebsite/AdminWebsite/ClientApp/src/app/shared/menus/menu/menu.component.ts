import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BookingPersistService } from '../../../services/bookings-persist.service';
import { Logger } from '../../../services/logger';

export type MenuItem = {
    id: string;
    label: string;
    ariaLabel?: string;
    data?: string;
};

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
    logger: Logger;
    form: FormGroup;
    private formBuilder: FormBuilder;
    loggerPrefix = '[Menu] -';
    selectedItems: [];

    @Output() selectedEmitter = new EventEmitter<string[]>();
    @Input() title = '';
    @Input() multiSelect = true;
    @Input() items: MenuItem[] = [];
    @Input() placeholder = 'Select items';
    @Input() ariaLabel = 'Selectable item list';

    constructor(private bookingPersistService: BookingPersistService, formBuilder: FormBuilder, logger: Logger) {
        this.logger = logger;
        this.formBuilder = formBuilder;
    }

    ngOnInit(): void {
        this.form = this.formBuilder.group({
            selectedIds: [this.bookingPersistService.selectedUsers || []]
        });
    }

    onSelect() {
        this.selectedItems = this.form.value['selectedIds'] || [];
        this.selectedEmitter.emit(this.selectedItems);
    }

    clear(): void {
        const searchCriteriaEntered = this.selectedItems && this.selectedItems.length > 0;
        if (searchCriteriaEntered) {
            this.selectedItems = [];
            this.form.reset();
            this.selectedEmitter.next(this.selectedItems);
        }
    }

    enable() {
        this.form.enable();
    }
    disable() {
        this.form.disable();
    }
}
