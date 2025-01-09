import { Component, Output, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Component({ selector: 'app-search-email', template: '' })
export class SearchEmailStubComponent {
    @Output()
    findParticipant = new EventEmitter<VHParticipant>();

    @Output()
    participantsNotFound = new EventEmitter();

    @Output()
    emailChanged = new EventEmitter<string>();

    @ViewChild('emailInput')
    emailInput: ElementRef;

    validateEmail() {
        return true;
    }
    clearEmail() {}
}
