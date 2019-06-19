import { Directive, HostListener, EventEmitter, Output, ElementRef, Inject } from '@angular/core';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/map';
import { DOCUMENT } from '@angular/common';

// Infinite scroller directive with RxJS Observables
@Directive({
  selector: '[appScrollable]'
})
export class ScrollableDirective {
  private reachedBottom = false;
  private lastScrollPosition = 0;

  @Output() scrollPosition = new EventEmitter();

  constructor(@Inject(DOCUMENT) private document: Document, private element: ElementRef) { }

  private getScreenBottom(): number {
    const offset = window.pageYOffset;
    return offset + this.document.documentElement.clientHeight;
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
      this.reachedBottom = false;
    } else if (!this.reachedBottom) {
      if (this.hasScrolledPastElementBottom(currentScrollPosition)) {
          this.reachedBottom = true;
          this.scrollPosition.emit();
      }
    }
    this.lastScrollPosition = currentScrollPosition;
  }
}
