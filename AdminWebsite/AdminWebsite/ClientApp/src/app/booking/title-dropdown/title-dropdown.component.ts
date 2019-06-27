import { FormControl } from '@angular/forms';
import { Component, Input, Output, OnInit } from '@angular/core';

const defaultValue = 'Please Select';

@Component({
    selector: 'app-title-dropdown',
    templateUrl: './title-dropdown.component.html'
})
export class TitleDropDownComponent implements OnInit {

    @Output()
    readonly formControl = new FormControl();

    @Output()
    selectedValue: string = null;

    readonly titleList =
    [
        defaultValue,
        'Mr',
        'Mrs',
        'Ms',
        'Rev',
        'Dr',
        'Lord',
        'Lady',
        'Sir',
        'Right Hon',
        'Viscount',
        'Duke',
        'Duchess'
    ];

    ngOnInit() {
        this.formControl.setValue(defaultValue);
        this.formControl.valueChanges.subscribe(value => {
            this.selectedValue = value === defaultValue ? null : value;
        });
    }
}
