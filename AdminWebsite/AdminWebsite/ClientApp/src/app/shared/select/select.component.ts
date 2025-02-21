import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Logger } from '../../services/logger';

export interface SelectOption {
    entityId: string;
    label: string;
    ariaLabel?: string;
    data?: string;
}

@Component({
    selector: 'app-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    standalone: false
})
export class SelectComponent implements OnChanges {
    logger: Logger;
    loggerPrefix = '[Menu] -';
    disabled = false;
    private _multiple: boolean;

    @Output() selectionChange = new EventEmitter<SelectOption | SelectOption[]>();

    @Input() title = '';
    @Input() items: SelectOption[] = [];
    @Input() placeholder = 'Select items';
    @Input() ariaLabel = 'Selectable item list';
    @Input() selectedEntityIds: string[] = [];

    @Input()
    set multiple(value: any) {
        this._multiple = this.coerceBooleanProperty(value);
    }
    get multiple() {
        return this._multiple;
    }

    private _selected: SelectOption[] = [];
    get selected(): SelectOption | SelectOption[] {
        return this._multiple ? this._selected || [] : this._selected[0];
    }

    constructor(logger: Logger) {
        this.logger = logger;
    }

    ngOnChanges(changes: SimpleChanges) {
        const items = changes['items'];
        if (items.currentValue) {
            this.updateSelectedItems();
        }
    }

    handleOnChange() {
        this.updateSelectedItems();
        this.selectionChange.emit(this.selected);
    }

    clear(): void {
        const searchCriteriaEntered = this._selected && this._selected.length > 0;
        if (searchCriteriaEntered) {
            this.selectedEntityIds = [];
            this._selected = [];
            this.selectionChange.next(this.selected);
        }
    }

    enable() {
        this.disabled = false;
    }
    disable() {
        this.disabled = true;
    }

    private updateSelectedItems() {
        this._selected = this.items.filter(item => (this.selectedEntityIds || []).includes(item.entityId));
    }

    // this can probably be exported at some point
    private coerceBooleanProperty(value: any): boolean {
        return value != null && `${value}` !== 'false';
    }
}
