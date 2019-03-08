import { Directive, HostListener, EventEmitter, Output, ElementRef, Inject, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/map';

interface ScrollPosition {
  pageYOffset: number;
  innerHeight: number;
  offsetHeight: number;
}

// Infinite scroller directive with RxJS Observables
@Directive({
  selector: '[appScrollable]'
})
export class ScrollableDirective implements AfterViewInit {

  private $scrollEvent: EventEmitter<any> = new EventEmitter();
  private $userScrolledDown: Observable<any>;
  private $requestCallBack: Observable<any>;

  lastPosition = 0;

  @Output() scrollPosition = new EventEmitter();

  constructor(public el: ElementRef) { }

  ngAfterViewInit() {
    this.streamScrollEvents();
    this.requestCallbackOnScroll();
  }

  private streamScrollEvents() {
    this.$userScrolledDown = this.$scrollEvent.asObservable()
      .map((e: any): ScrollPosition => ({
        pageYOffset: e.target.scrollTop,
        innerHeight: this.el.nativeElement.scrollHeight,
        offsetHeight: this.el.nativeElement.offsetHeight,
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
