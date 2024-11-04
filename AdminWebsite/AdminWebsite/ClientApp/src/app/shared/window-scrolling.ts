import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class WindowScrolling {
    constructor(@Inject(DOCUMENT) private readonly document: Document) {}

    getPosition(): number {
        return window.scrollY;
    }

    getWindowHeight(): number {
        return this.document.documentElement.clientHeight;
    }

    getScreenBottom(): number {
        return this.getPosition() + this.getWindowHeight();
    }
}
