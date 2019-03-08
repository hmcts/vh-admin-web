import { Injectable, ErrorHandler, Injector, NgZone } from '@angular/core';
import { LoggerService } from './logger.service';
import { Router } from '@angular/router';
import { PageUrls } from '../shared/page-url.constants';

@Injectable()
export class ErrorService extends ErrorHandler {

  // unfortunately, being an implementation of the ErrorHandler, if we try to
  // inject the dependencies in the constructor we get a cyclic resolution error
  // instead we have to get the injector and resolve the classes when using tem
  constructor(private injector: Injector, private zone: NgZone) {
    super();
  }

  handleError(err: any) {
    const router: Router = this.injector.get(Router);
    const logger: LoggerService = this.injector.get(LoggerService);

    err = this.unboxRejection(err);

    if (this.isUnauthorized(err)) {
      logger.error('User is not authorized - 401', err, { url: router.url });
      this.redirectTo(router, PageUrls.Unauthorised);
    } else {
      logger.error('Unhandled error occured', err, { url: router.url });
      this.redirectTo(router, PageUrls.ServiceProblem);
    }
  }

  private redirectTo(router: Router, page: string): any {
    // handle error executes outside of the angular zone so we need to force it back in to do the redirection correctly
    this.zone.run(() => router.navigate([page]));
  }

  private unboxRejection(err: any): any {
    // if the error is thrown through a promise, we can unbox the actual error this way
    return err.rejection || err;
  }

  private isUnauthorized(err) {
    return err.status && err.status === 401;
  }
}
