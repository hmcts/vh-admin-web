import { ReactiveFormsModule } from '@angular/forms';
import { TitleDropDownComponent } from './title-dropdown.component';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

describe('TitleDropdownComponent', () => {
    it('is null by default', () => {
        const component = new TitleDropDownComponent();
        component.ngOnInit();

        expect(component.selectedValue).toBeNull();
    });

    it('is null if selecting the placeholder value', () => {
        const component = new TitleDropDownComponent();
        component.ngOnInit();

        component.formControl.setValue('Mr');
        expect(component.selectedValue).toBe('Mr');

        component.formControl.setValue('Please Select');
        expect(component.selectedValue).toBeNull();
    });

    it('can select an item from dropdown and change selected status', () => {
        TestBed.configureTestingModule({
            declarations: [ TitleDropDownComponent ],
            imports: [ ReactiveFormsModule ]
        }).compileComponents();

        const fixture = TestBed.createComponent(TitleDropDownComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.ngOnInit();

        component.formControl.setValue('Mr');
        fixture.detectChanges();

        const selectElement = fixture.debugElement.query(By.css('select'));
        selectElement.nativeElement.value = 'Mr';
        fixture.detectChanges();
        expect(component.selectedValue).toBe('Mr');
    });
});
