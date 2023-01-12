import { EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { Logger } from '../../services/logger';

export abstract class MenuBase implements OnInit {
    logger: Logger;
    private formBuilder: FormBuilder

    abstract loggerPrefix: string;
    abstract formGroupName: string;
    form: FormGroup;
    error = false;
    abstract selectedItems: Array<any>;
    abstract loadItems(): void;
    abstract formConfiguration: any;

    @Output() selectedEmitter = new EventEmitter<Array<any>>();
    @Input() clearEmitter = new EventEmitter();

    abstract persistentItems : Array<any>;

    constructor(
        formBuilder: FormBuilder,
        logger: Logger
    ) {
        this.logger = logger;
        this.formBuilder = formBuilder;
    }

    ngOnInit(): void {
        this.form = this.initializeForm();
        this.loadItems();
        this.clearEmitter.subscribe(x => {
            this.onClear();
        });
    }

    private initializeForm(): FormGroup {
        return this.formBuilder.group(this.formConfiguration);
    }

    onSelect($event: string[]) {
        this.selectedItems = this.form.value[this.formGroupName];
        this.selectedEmitter.emit(this.selectedItems);
    }

    onClear(): void {
        const searchCriteriaEntered =
            (this.selectedItems && this.selectedItems.length > 0);
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
