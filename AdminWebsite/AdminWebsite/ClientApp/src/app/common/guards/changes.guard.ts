import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class ChangesGuard implements CanDeactivate<CanDeactiveComponent> {
    constructor(private router: Router) {}

    canDeactivate(
        component: CanDeactiveComponent,
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
        nextState?: RouterStateSnapshot
    ) {
        return component.canDeactive ? component.canDeactive() : true;
    }
}

export interface CanDeactiveComponent {
    canDeactive: () => Observable<boolean> | Promise<boolean> | boolean;
}
