import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserIdentityService } from '../services/user-identity.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';


@Injectable()
export class AdminGuard implements CanActivate {

  constructor(private userIdentityService: UserIdentityService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.userIdentityService.getUserInformation().pipe(
      map(userProfile => {
        if (userProfile && (userProfile.is_vh_officer_administrator_role || userProfile.is_case_administrator)) {
          return true;
        } else {
          this.router.navigate(['/unauthorised']);
          return false;
        }
      }),
      catchError((err) => {
        console.error(`Could not get user identity: ${err}`);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

}
