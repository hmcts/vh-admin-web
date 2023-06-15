import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-justice-users-menu',
    template: ''
})
export class JusticeUserMenuStubComponent {
    selectedLabel: string;

    @Output() selectedEmitter = new EventEmitter<string[] | string>();
    @Input() dropDownLabel = 'Allocated CSO';
    @Input() multiSelect = true;
    loadItems() {
        console.log('stub method');
    }
    clear() {
        console.log('stub method');
    }
    enabled(enabled: boolean) {
        console.log(`Justice User Menu component enabled state changed to : ${enabled}`);
    }
}
