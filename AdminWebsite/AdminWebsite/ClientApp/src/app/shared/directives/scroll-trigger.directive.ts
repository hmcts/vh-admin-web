import { Directive, HostListener, EventEmitter, Output, ElementRef } from '@angular/core';
import { WindowScrolling } from '../window-scrolling';

@Directive({
  selector: '[appScrollTrigger]'
})
export class ScrollTriggerDirective {
  private atBottom = false;
  private lastScrollPosition = 0;

  @Output() scrolledPast = new EventEmitter();

  constructor(
    private element: ElementRef,
    private scroll: WindowScrolling
  ) { }

  private getScreenBottom(): number {
    const offset = this.scroll.getPosition();
    return offset + this.scroll.getWindowHeight();
  }

  private getElementBottom(): number {
    return this.element.nativeElement.clientHeight + this.element.nativeElement.offsetTop;
  }

  private hasScrolledPastElementBottom(scrollPosition: number): boolean {
    return scrollPosition > this.getElementBottom();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScrollPosition = this.getScreenBottom();
    const hasScrolledUp = currentScrollPosition < this.lastScrollPosition;
    if (hasScrolledUp) {
      this.atBottom = false;
    } else if (!this.atBottom) {
      if (this.hasScrolledPastElementBottom(currentScrollPosition)) {
          this.atBottom = true;
          this.scrolledPast.emit();
      }
    }
    this.lastScrollPosition = currentScrollPosition;
  }
}
