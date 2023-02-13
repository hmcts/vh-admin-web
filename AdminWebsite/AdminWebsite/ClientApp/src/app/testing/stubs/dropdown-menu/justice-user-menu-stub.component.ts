import { Component } from '@angular/core';

@Component({
    selector: 'app-justice-users-menu',
    template: ''
})
export class JusticeUserMenuStubComponent {
    selectedLabel: string;
    multiSelect: boolean;
    dropDownLabel: string;
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
