import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { from, Observable } from 'rxjs';
import { ConfigService } from 'src/app/services/config.service';

@Injectable()
export class EmailPatternResolver implements Resolve<string> {
    constructor(private configService: ConfigService) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<string> {
        return from(this.getData());
    }

    async getData() {
        const settings = await this.configService.getClientSettings().toPromise();
        return settings.test_username_stem;
    }
}
