import { Directive, HostListener, EventEmitter, Output, ElementRef, Inject } from '@angular/core';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/map';
import { DOCUMENT } from '@angular/common';
import { WindowScrolling } from '../window-scrolling';

// Infinite scroller directive with RxJS Observables
@Directive({
  selector: '[appScrollable]'
})
export class ScrollableDirective {
  private atBottom = false;
  private lastScrollPosition = 0;

  @Output() bottomReached = new EventEmitter();

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
          this.bottomReached.emit();
      }
    }
    this.lastScrollPosition = currentScrollPosition;
  }
}
