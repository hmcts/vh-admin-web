import { Directive, HostListener, EventEmitter, Output, ElementRef, Inject, AfterViewInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/map';
import { DOCUMENT } from '@angular/common';

interface ScrollPosition {
  pageYOffset: number;
  innerHeight: number;
  offsetHeight: number;
}

// Infinite scroller directive with RxJS Observables
@Directive({
  selector: '[appScrollable]'
})
export class ScrollableDirective implements AfterViewInit, OnDestroy {

  private $scrollEvent: EventEmitter<any> = new EventEmitter();
  private $userScrolledDown: Observable<any>;
  private $requestCallBack: Observable<any>;
  private rootElement: ElementRef;
  private pastBottom = false;

  lastPosition = 0;

  @Output() scrollPosition = new EventEmitter();

  constructor(@Inject(DOCUMENT) private document: Document, private element: ElementRef ) {
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const offset = window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    const scrollBottom = offset + this.document.documentElement.clientHeight;
    const clientBottom = this.element.nativeElement.clientHeight + this.element.nativeElement.offsetTop;
    if (scrollBottom > clientBottom) {
      // raise event only if we haven't already past bottom
      if (!this.pastBottom) {
        console.log('past bottom');
        this.scrollPosition.emit();
        this.pastBottom = true;
      }
    } else if (this.pastBottom && scrollBottom < clientBottom) {
      if (this.pastBottom) {
        console.log('scroll up');
        this.pastBottom = false;
      }
    }
  }

  private streamScrollEvents() {
    this.$userScrolledDown = this.$scrollEvent.asObservable()
      .map((e: any): ScrollPosition => ({
        pageYOffset: e.target.scrollTop,
        innerHeight: this.rootElement.nativeElement.scrollHeight,
        offsetHeight: this.rootElement.nativeElement.offsetHeight,
      }))
      .pairwise()
      .filter(positions => this.isUserScrollingDown(positions) && this.isLoadingScrollPosition(positions[1]));

  }

  private isUserScrollingDown = (positions) => {
    return positions[0].pageYOffset < positions[1].pageYOffset;
  }

  private isLoadingScrollPosition = (position) => {
    return  position.offsetHeight + position.pageYOffset >= position.innerHeight;
  }

  private requestCallbackOnScroll() {
    this.$requestCallBack = this.$userScrolledDown;
    this.$requestCallBack
      .subscribe(() => { this.scrollPosition.emit(); });
  }

  @HostListener('scroll', ['$event'])
  onScroll(event) {

    try {
      this.$scrollEvent.next(event);
    } catch (err) { }
  }
}
