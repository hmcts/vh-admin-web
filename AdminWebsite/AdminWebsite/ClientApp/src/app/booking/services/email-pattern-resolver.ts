import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from 'src/app/services/config.service';

@Injectable()
export class EmailPatternResolver implements Resolve<string> {
    constructor(private configService: ConfigService) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<string> {
        return this.configService.getClientSettings().pipe(
            map(x => x.test_username_stem)
        );
    }
}
