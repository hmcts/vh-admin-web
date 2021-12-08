import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({ selector: 'app-remove-popup', template: '' })
export class RemovePopupStubComponent {
    @Output() continueRemove: EventEmitter<any> = new EventEmitter<any>();

    @Output() cancelRemove: EventEmitter<any> = new EventEmitter<any>();

    @Input() fullName: string;
}
