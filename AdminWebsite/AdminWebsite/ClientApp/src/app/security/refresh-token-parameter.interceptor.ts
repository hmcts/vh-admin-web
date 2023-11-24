import { HttpInterceptor, HttpHandler, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VhOidcSecurityService } from './vh-oidc-security.service';

@Injectable()
export class RefreshTokenParameterInterceptor implements HttpInterceptor {
    constructor(private oidcSecurityService: VhOidcSecurityService) {}
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.oidcSecurityService.getConfiguration().subscribe(configuration => {
            if (req.method === 'POST' && req.url.endsWith('/oauth2/v2.0/token') && configuration.scope && req.body) {
                let body = req.body as string;
                body += `&scope=${encodeURI(configuration.scope)}`;
                req = req.clone({
                    body: body
                });
            }
        });

        return next.handle(req);
    }
}
