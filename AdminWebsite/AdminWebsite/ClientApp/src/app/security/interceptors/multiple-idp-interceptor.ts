import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';

@Injectable({
    providedIn: 'root'
})
export class MultipleIdpInterceptorService implements HttpInterceptor {
    constructor(private readonly securityService: SecurityService) {}
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return this.securityService.getAccessToken().pipe(
            mergeMap(token => {
                if (token) {
                    const authReq = req.clone({
                        headers: req.headers.set('Authorization', 'Bearer ' + token)
                    });
                    return next.handle(authReq);
                }
                return next.handle(req);
            })
        );
    }
}
