import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Logger } from '../../services/logger';

export type MenuItem = {
    entityId: string;
    label: string;
    ariaLabel?: string;
    data?: string;
};

@Component({
    selector: 'app-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss']
})
export class SelectComponent {
    logger: Logger;
    loggerPrefix = '[Menu] -';
    selectedItems: MenuItem[] = [];
    disabled = false;

    @Output() itemSelected = new EventEmitter<MenuItem | MenuItem[]>();

    @Input() title = '';
    @Input() multiSelect = true;
    @Input() items: MenuItem[] = [];
    @Input() placeholder = 'Select items';
    @Input() ariaLabel = 'Selectable item list';
    // TODO update selectedItems on set, or maybe make selectedItems a func
    @Input() selectedEntityIds: string[] = [];

    constructor(logger: Logger) {
        this.logger = logger;
    }

    onSelect(selectedItems: MenuItem[]) {
        console.log(':::: onSelect(), selectedItems', selectedItems);
        this.selectedItems = this.items.filter(item => this.selectedEntityIds.includes(item.entityId));
        this.itemSelected.emit(this.selectedItems);
    }

    // TODO rethink this func - where is it used? is it needed?
    clear(): void {
        console.log(':::: clear()');
        const searchCriteriaEntered = this.selectedItems && this.selectedItems.length > 0;
        if (searchCriteriaEntered) {
            this.selectedItems = [];
            this.itemSelected.next(this.selectedItems);
            this.selectedEntityIds = [];
        }
    }

    enable() {
        this.disabled = false;
    }
    disable() {
        this.disabled = true;
    }
}
