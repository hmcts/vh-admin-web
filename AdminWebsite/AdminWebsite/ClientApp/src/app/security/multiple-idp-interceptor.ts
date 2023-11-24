import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { ISecurityService } from './services/security-service.interface';
import { SecurityConfigService } from './services/security-config.service';

@Injectable({
    providedIn: 'root'
})
export class MultipleIdpInterceptorService implements HttpInterceptor {
    currentIdp: string;
    securityService: ISecurityService;

    constructor(private securityServiceProviderService: SecurityConfigService) {
        this.securityService = securityServiceProviderService.getSecurityService();
        this.currentIdp = this.securityServiceProviderService.currentIdpConfigId;
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return this.securityService.getAccessToken(this.currentIdp).pipe(
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
