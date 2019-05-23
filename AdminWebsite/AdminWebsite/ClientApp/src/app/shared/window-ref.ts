import { Injectable } from '@angular/core';

@Injectable()
export class WindowRef {
  getLocation(): WindowLocation {
    // return the global native browser window location object
    // had to implement this as a method rather than a getter because the latter couldn't be mocked
    return new WindowLocation(
      window.location.pathname,
      window.location.search,
      window.location.hash
    );
  }
}

export class WindowLocation {
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly href: string;

  constructor(pathname: string, search: string = null, hash: string = null) {
    this.pathname = pathname;
    this.search = search;
    this.hash = hash;
    this.href = pathname + (search || '') + (hash || '');
  }
}
