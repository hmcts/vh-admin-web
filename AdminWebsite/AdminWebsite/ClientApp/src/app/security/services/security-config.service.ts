import {OidcSecurityService} from "angular-auth-oidc-client";
import {BehaviorSubject, Observable} from "rxjs";
import {ISecurityService} from "./security-service.interface";
import {Injectable} from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class SecurityConfigService {
    private idpConfigIdSubject: BehaviorSubject<string>;
    constructor(private oidcSecurityService: OidcSecurityService) {
        this.idpConfigIdSubject = new BehaviorSubject<string>('reform');
    }
    set currentIdpConfigId(idpConfigId: string) {
        this.idpConfigIdSubject.next(idpConfigId);
    }

    get currentIdpConfigId$(): Observable<string> {
        return this.idpConfigIdSubject.asObservable();
    }
    getSecurityService(): ISecurityService {
        return this.oidcSecurityService;
    }
}
