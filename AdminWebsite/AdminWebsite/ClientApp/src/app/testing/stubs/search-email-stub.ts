import { Component, Output } from '@angular/core';
import { EventEmitter } from 'events';

@Component({ selector: 'app-search-email', template: '' })
export class SearchEmailStubComponent {
    @Output()
    findParticipant = new EventEmitter();
    validateEmail() {
        return true;
    }
    clearEmail() {

    }
}
