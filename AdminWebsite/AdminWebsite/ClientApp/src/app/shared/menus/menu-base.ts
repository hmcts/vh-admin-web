import { EventEmitter, Injectable, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Logger } from '../../services/logger';

@Injectable()
export abstract class MenuBase implements OnInit {
    protected constructor(formBuilder: UntypedFormBuilder, logger: Logger) {
        this.logger = logger;
        this.formBuilder = formBuilder;
    }
    logger: Logger;
    form: UntypedFormGroup;
    error = false;
    private formBuilder: UntypedFormBuilder;

    abstract loggerPrefix: string;
    abstract formGroupName: string;
    abstract selectedItems: Array<any>;
    abstract formConfiguration: any;

    @Output() selectedEmitter = new EventEmitter<Array<any>>();
    enabled(value) {
        if (value !== false) {
            this.form.controls[this.formGroupName].enable();
        } else {
            this.form.controls[this.formGroupName].disable();
        }
    }
    abstract loadItems(): void;

    ngOnInit(): void {
        this.form = this.initializeForm();
        this.loadItems();
    }

    private initializeForm(): UntypedFormGroup {
        return this.formBuilder.group(this.formConfiguration);
    }

    onSelect() {
        this.selectedItems = this.form.value[this.formGroupName];
        this.selectedEmitter.emit(this.selectedItems);
    }

    clear(): void {
        const searchCriteriaEntered = this.selectedItems && this.selectedItems.length > 0;
        if (searchCriteriaEntered) {
            this.selectedItems = [];
            this.form.reset();
        }
    }

    handleListError(err, type) {
        this.logger.error(`${this.loggerPrefix} Error getting ${type} list`, err, type);
        this.error = true;
    }
}
