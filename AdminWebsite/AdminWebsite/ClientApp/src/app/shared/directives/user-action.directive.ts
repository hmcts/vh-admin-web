import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[appUserAction]'
})
export class UserActionDirective {
    @Output() userActionDetected = new EventEmitter();

    @HostListener('click')
    onMouseClick() {
        this.userActionDetected.emit();
    }
}
