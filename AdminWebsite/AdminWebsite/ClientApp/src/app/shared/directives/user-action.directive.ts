import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[appUserAction]'
})
export class UserActionDirective {
    @Output() userActionDetected = new EventEmitter();

    @HostListener('document:keydown')
    @HostListener('document:click')
    onMouseClick() {
        console.warn('event detected');
        this.userActionDetected.emit();
    }
}
