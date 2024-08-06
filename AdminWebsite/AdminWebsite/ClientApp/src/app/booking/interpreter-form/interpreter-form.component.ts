import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AvailableLanguageResponse, InterprepretationType } from 'src/app/services/clients/api-client';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { InterpreterSelectedDto } from './interpreter-selected.model';

@Component({
    selector: 'app-interpreter-form',
    templateUrl: './interpreter-form.component.html'
})
export class InterpreterFormComponent implements OnInit, OnDestroy, OnChanges {
    forceDisplayForm: boolean;

    @Input() set requireLanguageSelection(forceSelection: boolean) {
        this.forceDisplayForm = forceSelection;
        this.displayForm = forceSelection;
        this.cdRef.detectChanges();
    }

    @Output() interpreterLanguageSelected = new EventEmitter<InterpreterSelectedDto>();

    availableLanguages: AvailableLanguageResponse[] = [];
    displayForm = false;
    form: FormGroup<InterpreterForm>;

    checkboxId = 'interpreter-required-' + Math.random().toString(36).substring(2, 9);

    private onDestroy$ = new Subject<void>();

    constructor(private refDataService: ReferenceDataService, private formBuilder: FormBuilder, private cdRef: ChangeDetectorRef) {
        this.createForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.requireLanguageSelection) {
            this.forceValidation();
        }
    }

    get availableSignLanguages(): AvailableLanguageResponse[] {
        return this.availableLanguages.filter(l => l.type === InterprepretationType.Sign);
    }

    get availableSpokenLanguages(): AvailableLanguageResponse[] {
        return this.availableLanguages.filter(l => l.type === InterprepretationType.Verbal);
    }

    createForm() {
        this.form = this.formBuilder.group<InterpreterForm>(
            {
                signLanguageCode: this.formBuilder.control(null),
                spokenLanguageCode: this.formBuilder.control(null)
            },
            {
                validators: this.languageCodeValidator
            }
        );

        this.form.controls.signLanguageCode.valueChanges.pipe(takeUntil(this.onDestroy$)).subscribe(value => {
            if (value) {
                this.form.controls.spokenLanguageCode.setValue(null);
            }
            if (value === 'null') {
                this.form.controls.signLanguageCode.setValue(null);
            }
            this.publishInterpreterLanguageSelection();
        });

        this.form.controls.spokenLanguageCode.valueChanges.pipe(takeUntil(this.onDestroy$)).subscribe(value => {
            if (value) {
                this.form.controls.signLanguageCode.setValue(null);
            }
            if (value === 'null') {
                this.form.controls.spokenLanguageCode.setValue(null);
            }
            this.publishInterpreterLanguageSelection();
        });
    }

    prepopulateForm(interpreterSelected: InterpreterSelectedDto) {
        if (!interpreterSelected) {
            return;
        }
        this.displayForm = interpreterSelected.interpreterRequired;
        this.form.setValue({
            signLanguageCode: interpreterSelected.signLanguageCode,
            spokenLanguageCode: interpreterSelected.spokenLanguageCode
        });
        this.cdRef.detectChanges();
    }

    resetForm(keepDisplayForm = false) {
        this.displayForm = keepDisplayForm;
        this.form.reset();
        this.form.markAsPristine();
    }

    forceValidation() {
        this.form.markAsDirty();
        this.form.updateValueAndValidity();
    }

    ngOnInit(): void {
        this.refDataService
            .getAvailableInterpreterLanguages()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(languages => {
                this.availableLanguages = languages;
            });
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    onInterpreterRequiredChange(interpreterRequired: boolean) {
        if (!interpreterRequired) {
            this.resetForm();
        }
        this.publishInterpreterLanguageSelection();
    }

    publishInterpreterLanguageSelection() {
        const interpreterRequired = this.displayForm;
        if (!interpreterRequired) {
            this.interpreterLanguageSelected.emit({ interpreterRequired: false });
            return;
        }

        const dto: InterpreterSelectedDto = {
            interpreterRequired: true,
            signLanguageCode: this.form.value.signLanguageCode,
            spokenLanguageCode: this.form.value.spokenLanguageCode,
            signLanguageDescription:
                this.availableSignLanguages.find(l => l.code === this.form.value.signLanguageCode)?.description ?? null,
            spokenLanguageCodeDescription:
                this.availableSpokenLanguages.find(l => l.code === this.form.value.spokenLanguageCode)?.description ?? null
        };
        this.interpreterLanguageSelected.emit(dto);
    }

    languageCodeValidator = (group: FormGroup): { [key: string]: any } | null => {
        if (group.pristine && !this.forceDisplayForm) {
            return null;
        }
        const signLanguageCode = group.get('signLanguageCode').value;
        const spokenLanguageCode = group.get('spokenLanguageCode').value;

        // If both are null, return error
        if (this.displayForm && !signLanguageCode && !spokenLanguageCode) {
            return { interpreterLangMissing: true };
        }

        // If at least one is not null, return null (no error)
        return null;
    };
}

interface InterpreterForm {
    signLanguageCode: FormControl<string | null>;
    spokenLanguageCode: FormControl<string | null>;
}
