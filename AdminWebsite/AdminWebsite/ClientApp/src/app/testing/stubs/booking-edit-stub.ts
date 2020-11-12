import { Component, Input } from '@angular/core';

@Component({ selector: 'app-booking-edit', template: '' })
export class BookingEditStubComponent {
    private _editLink: string;
    @Input()
    set editLink(editLink: string) {
        this._editLink = editLink;
    }

    @Input()
    title: string;
    get editLink() {
        return this._editLink;
    }

    @Input()
    elementId: string;
}
