import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AvailableLanguageResponse, InterprepretationType } from 'src/app/services/clients/api-client';
import { ReferenceDataService } from 'src/app/services/reference-data.service';

@Component({
    selector: 'app-interpreter-form',
    templateUrl: './interpreter-form.component.html',
    styleUrl: './interpreter-form.component.scss'
})
export class InterpreterFormComponent implements OnInit, OnDestroy {
    availableLanguages: AvailableLanguageResponse[] = [];
    interprepretationType = InterprepretationType;

    displayForm = true;
    selectedType?: InterprepretationType = null;

    form: FormGroup<InterpreterForm>;

    private onDestroy$ = new Subject<void>();

    constructor(private refDataService: ReferenceDataService, private formBuilder: FormBuilder) {
        this.createForm();
    }

    createForm() {
        this.form = this.formBuilder.group<InterpreterForm>({
            signLanguageCode: this.formBuilder.control(null),
            spokenLanguageCode: this.formBuilder.control(null),
            type: this.formBuilder.control(null)
        });

        this.form.valueChanges.pipe(takeUntil(this.onDestroy$)).subscribe(input => {
            // do not emit until form has interacted with
            if (this.form.pristine) {
                return;
            }

            // this.selectedType = input.type;
            if (input.signLanguageCode && input.signLanguageCode !== 'null') {
                this.form.setValue(
                    { signLanguageCode: input.signLanguageCode, spokenLanguageCode: null, type: this.interprepretationType.Sign },
                    { emitEvent: false }
                );
            }

            if (input.spokenLanguageCode && input.spokenLanguageCode !== 'null') {
                this.form.setValue(
                    { signLanguageCode: null, spokenLanguageCode: input.spokenLanguageCode, type: this.interprepretationType.Verbal },
                    { emitEvent: false }
                );
            }

            if (
                (!input.signLanguageCode || input.signLanguageCode === 'null') &&
                (!input.spokenLanguageCode || input.spokenLanguageCode === 'null')
            ) {
                this.form.setValue({ signLanguageCode: null, spokenLanguageCode: null, type: null }, { emitEvent: false });
            }
        });
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

    get availableSignLanguages(): AvailableLanguageResponse[] {
        return this.availableLanguages.filter(l => l.type === this.interprepretationType.Sign);
    }

    get availableSpokenLanguages(): AvailableLanguageResponse[] {
        return this.availableLanguages.filter(l => l.type === this.interprepretationType.Verbal);
    }
}

interface InterpreterForm {
    type: FormControl<InterprepretationType | null>;
    signLanguageCode: FormControl<string | null>;
    spokenLanguageCode: FormControl<string | null>;
}
