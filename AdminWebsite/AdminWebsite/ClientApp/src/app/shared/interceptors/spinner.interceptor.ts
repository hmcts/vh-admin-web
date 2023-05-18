import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoadingSpinnerService } from 'src/app/services/loading-spinner.service';
import { finalize } from 'rxjs/operators';

@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {
    private ignoredRoutes = ['api/feature-flag', 'conference-status'];
    constructor(private spinnerService: LoadingSpinnerService) {}

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (request.method === 'Post' && request.url.includes('api/hearing')) {
            return next.handle(request);
        }
        if (this.ignoredRoutes.some(x => request.url.includes(x)) || !request.url.includes('api/')) {
            return next.handle(request);
        }

        this.spinnerService.requestStarted();
        return next.handle(request).pipe(
            finalize(() => {
                this.spinnerService.requestEnded();
            })
        );
    }
}
