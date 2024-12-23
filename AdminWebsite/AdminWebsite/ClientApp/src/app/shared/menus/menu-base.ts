import { EventEmitter, Injectable, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '../../services/logger';

@Injectable()
export abstract class MenuBase implements OnInit {
    constructor(formBuilder: FormBuilder, logger: Logger) {
        this.logger = logger;
        this.formBuilder = formBuilder;
    }

    logger: Logger;
    form: FormGroup;
    error = false;
    selectedLabel: any;
    items: any;
    private readonly formBuilder: FormBuilder;

    abstract loggerPrefix: string;
    abstract formGroupName: string;
    abstract selectedItems: any;
    abstract formConfiguration: any;

    @Output() selectedEmitter = new EventEmitter<any>();
    enabled() {
        this.form.controls[this.formGroupName].enable();
    }
    disabled() {
        this.form.controls[this.formGroupName].disable();
    }
    abstract loadItems(): void;

    ngOnInit(): void {
        this.form = this.initializeForm();
        this.loadItems();
    }

    private initializeForm(): FormGroup {
        return this.formBuilder.group(this.formConfiguration);
    }

    onSelect() {
        this.selectedItems = this.form.value[this.formGroupName];
        this.selectedLabel = this.items.filter(x => x.id === this.selectedItems).map(y => y.username)[0];
        this.selectedEmitter.emit(this.selectedItems);
    }

    clear(): void {
        const searchCriteriaEntered = this.selectedItems && this.selectedItems.length > 0;
        if (searchCriteriaEntered) {
            this.selectedItems = [];
            this.selectedLabel = undefined;
            this.form.reset();
            this.selectedEmitter.next(this.selectedItems);
        }
    }

    handleListError(err, type) {
        this.logger.error(`${this.loggerPrefix} Error getting ${type} list`, err, type);
        this.error = true;
    }
}
