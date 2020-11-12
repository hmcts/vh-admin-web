import { AdalInterceptor } from 'adal-angular4';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * This custom adal interceptor will wrap any http call adding on the adal jwt token.
 * It will also add Cache-Control headers to the request. This is required for IE11
 * which may otherwise end up caching all the ajax requests.
 * https://www.itworld.com/article/2693447/ajax-requests-not-executing-or-updating-in-internet-explorer-solution.html
 */
@Injectable()
export class CustomAdalInterceptor implements HttpInterceptor {
    constructor(public adalInteceptor: AdalInterceptor) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (request.method === 'GET') {
            const customRequest = request.clone({
                setHeaders: {
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache'
                }
            });
            return this.adalInteceptor.intercept(customRequest, next);
        }
        return this.adalInteceptor.intercept(request, next);
    }
}
