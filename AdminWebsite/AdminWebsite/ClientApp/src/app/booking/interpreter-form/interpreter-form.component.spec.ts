import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { InterpreterFormComponent } from './interpreter-form.component';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { InterpreterSelectedDto } from './interpreter-selected.model';
import { AvailableLanguageResponse, InterprepretationType } from 'src/app/services/clients/api-client';

describe('InterpreterFormComponent', () => {
    let component: InterpreterFormComponent;
    let fixture: ComponentFixture<InterpreterFormComponent>;
    let refDataServiceSpy: jasmine.SpyObj<ReferenceDataService>;

    beforeEach(async () => {
        const refDataLanguages: AvailableLanguageResponse[] = [
            new AvailableLanguageResponse({ description: 'British Sign Language', code: 'bsl', type: InterprepretationType.Sign }),
            new AvailableLanguageResponse({ description: 'American Sign Language', code: 'asl', type: InterprepretationType.Sign }),
            new AvailableLanguageResponse({ description: 'French', code: 'fr', type: InterprepretationType.Verbal }),
            new AvailableLanguageResponse({ description: 'German', code: 'de', type: InterprepretationType.Verbal })
        ];

        refDataServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService', ['getAvailableInterpreterLanguages']);
        refDataServiceSpy.getAvailableInterpreterLanguages.and.returnValue(of(refDataLanguages));
        await TestBed.configureTestingModule({
            declarations: [InterpreterFormComponent],
            providers: [FormBuilder, { provide: ReferenceDataService, useValue: refDataServiceSpy }],
            imports: [FormsModule, ReactiveFormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(InterpreterFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize form on component creation', () => {
        expect(component.form).toBeDefined();
        expect(component.form.controls.signLanguageCode.value).toBeNull();
        expect(component.form.controls.spokenLanguageCode.value).toBeNull();
    });

    it('should reset form on resetForm method call', () => {
        component.displayForm = true;
        component.form.setValue({ signLanguageCode: null, spokenLanguageCode: 'fr' }, { emitEvent: false });

        component.resetForm();

        expect(component.displayForm).toBeFalse();
        expect(component.form.controls.signLanguageCode.value).toBeNull();
        expect(component.form.controls.spokenLanguageCode.value).toBeNull();
    });

    describe('subscribe to sign language code changes', () => {
        let langSelectedEmitter: jasmine.Spy<(value?: InterpreterSelectedDto) => void>;
        beforeEach(() => {
            langSelectedEmitter = spyOn(component.interpreterLanguageSelected, 'emit');
            component.displayForm = true;
        });

        it('should set and publish sign language selection - null', () => {
            component.form.controls.signLanguageCode.setValue('bsl');
            component.form.controls.signLanguageCode.setValue(null);
            expect(component.form.controls.signLanguageCode.value).toBeNull();

            expect(langSelectedEmitter).toHaveBeenCalledWith({
                interpreterRequired: true,
                signLanguageCode: null,
                spokenLanguageCode: null,
                signLanguageDescription: null,
                spokenLanguageCodeDescription: null
            });
        });

        it('should set and publish sign language selection - code', () => {
            component.form.controls.signLanguageCode.setValue('bsl');
            expect(langSelectedEmitter).toHaveBeenCalledWith({
                interpreterRequired: true,
                signLanguageCode: 'bsl',
                signLanguageDescription: 'British Sign Language',
                spokenLanguageCode: null,
                spokenLanguageCodeDescription: null
            });
        });

        it('should set spoken language to null when sign language is selected', () => {
            component.form.reset(
                {
                    signLanguageCode: null,
                    spokenLanguageCode: 'fr'
                },
                { emitEvent: false }
            );

            component.form.controls.signLanguageCode.setValue('bsl');
            expect(langSelectedEmitter).toHaveBeenCalledWith({
                interpreterRequired: true,
                signLanguageCode: 'bsl',
                signLanguageDescription: 'British Sign Language',
                spokenLanguageCode: null,
                spokenLanguageCodeDescription: null
            });
        });

        it('should fail validation when changing signLanguageCode to null and spokenLanguageCode is null', () => {
            component.form.controls.signLanguageCode.setValue('bsl');
            component.form.markAsDirty();

            component.form.setValue({ signLanguageCode: 'null', spokenLanguageCode: 'null' });
            component.form.updateValueAndValidity();

            expect(component.form.valid).toBeFalse();
        });
    });

    describe('subscribe to spoken language code changes', () => {
        let langSelectedEmitter: jasmine.Spy<(value?: InterpreterSelectedDto) => void>;
        beforeEach(() => {
            langSelectedEmitter = spyOn(component.interpreterLanguageSelected, 'emit');
            component.displayForm = true;
        });

        it('should set and publish spoken language selection - null', () => {
            component.form.controls.spokenLanguageCode.setValue('fr');
            component.form.controls.spokenLanguageCode.setValue(null);
            expect(component.form.controls.spokenLanguageCode.value).toBeNull();

            expect(langSelectedEmitter).toHaveBeenCalledWith({
                interpreterRequired: true,
                signLanguageCode: null,
                spokenLanguageCode: null,
                signLanguageDescription: null,
                spokenLanguageCodeDescription: null
            });
        });

        it('should set and publish spokenLanguageCode language selection - code', () => {
            component.form.controls.spokenLanguageCode.setValue('fr');
            expect(langSelectedEmitter).toHaveBeenCalledWith({
                interpreterRequired: true,
                signLanguageCode: null,
                signLanguageDescription: null,
                spokenLanguageCode: 'fr',
                spokenLanguageCodeDescription: 'French'
            });
        });

        it('should set sign language to null when spoken language is selected', () => {
            component.form.reset(
                {
                    signLanguageCode: 'bsl',
                    spokenLanguageCode: null
                },
                { emitEvent: false }
            );

            component.form.controls.spokenLanguageCode.setValue('fr');
            expect(langSelectedEmitter).toHaveBeenCalledWith({
                interpreterRequired: true,
                signLanguageCode: null,
                spokenLanguageCode: 'fr',
                signLanguageDescription: null,
                spokenLanguageCodeDescription: 'French'
            });
        });

        it('should fail validation when changing signLanguageCode to null and spokenLanguageCode is null', () => {
            component.form.controls.spokenLanguageCode.setValue('fr');
            component.form.markAsDirty();

            component.form.setValue({ signLanguageCode: 'null', spokenLanguageCode: 'null' });
            component.form.updateValueAndValidity();

            expect(component.form.valid).toBeFalse();
        });
    });

    describe('onInterpreterRequiredChange', () => {
        let langSelectedEmitter: jasmine.Spy<(value?: InterpreterSelectedDto) => void>;
        beforeEach(() => {
            langSelectedEmitter = spyOn(component.interpreterLanguageSelected, 'emit');
        });

        it('should reset form when interpreter is not required', () => {
            component.displayForm = true;
            component.form.setValue({ signLanguageCode: 'bsl', spokenLanguageCode: 'fr' });
            component.onInterpreterRequiredChange(false);

            expect(component.displayForm).toBeFalse();
            expect(component.form.controls.signLanguageCode.value).toBeNull();
            expect(component.form.controls.spokenLanguageCode.value).toBeNull();
            expect(langSelectedEmitter).toHaveBeenCalledWith({ interpreterRequired: false });
        });

        it('should publish interpreterRequired true when interpreter is required', () => {
            component.form.reset();
            component.displayForm = true;
            component.onInterpreterRequiredChange(true);
            expect(langSelectedEmitter).toHaveBeenCalledWith({
                interpreterRequired: true,
                signLanguageCode: null,
                spokenLanguageCode: null,
                signLanguageDescription: null,
                spokenLanguageCodeDescription: null
            });
        });
    });

    describe('prepopulateForm', () => {
        it('should set displayForm to true and set form values', () => {
            const interpreterSelected: InterpreterSelectedDto = {
                interpreterRequired: true,
                signLanguageCode: null,
                spokenLanguageCode: 'fr'
            };
            component.prepopulateForm(interpreterSelected);
            expect(component.displayForm).toBeTrue();
            expect(component.form.controls.signLanguageCode.value).toBeNull();
            expect(component.form.controls.spokenLanguageCode.value).toBe('fr');
        });

        it('should ignore when the interpreterRequired is false', () => {
            const interpreterSelected: InterpreterSelectedDto = {
                interpreterRequired: false,
                signLanguageCode: null,
                spokenLanguageCode: 'fr'
            };
            component.prepopulateForm(interpreterSelected);
            expect(component.displayForm).toBeFalse();
            expect(component.form.controls.signLanguageCode.value).toBeNull();
            expect(component.form.controls.spokenLanguageCode.value).toBeNull();
        });

        it('should ignore when paramater is null', () => {
            component.prepopulateForm(null);
            expect(component.displayForm).toBeFalse();
            expect(component.form.controls.signLanguageCode.value).toBeNull();
            expect(component.form.controls.spokenLanguageCode.value).toBeNull();
        });
    });

    it('should call refDataService.getAvailableInterpreterLanguages on component initialization', () => {
        component.ngOnInit();
        expect(refDataServiceSpy.getAvailableInterpreterLanguages).toHaveBeenCalled();
        expect(component.availableSignLanguages.length).toBeGreaterThan(0);
        expect(component.availableSpokenLanguages.length).toBeGreaterThan(0);
    });

    it('should unsubscribe from onDestroy$ subject on component destruction', () => {
        const onDestroy$NextSpy = spyOn(component['onDestroy$'], 'next');
        const onDestroy$CompleteSpy = spyOn(component['onDestroy$'], 'complete');
        component.ngOnDestroy();
        expect(onDestroy$NextSpy).toHaveBeenCalled();
        expect(onDestroy$CompleteSpy).toHaveBeenCalled();
    });
});
