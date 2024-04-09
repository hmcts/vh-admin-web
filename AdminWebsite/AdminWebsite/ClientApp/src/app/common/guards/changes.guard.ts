import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class ChangesGuard {
    canDeactivate(component: CanDeactiveComponent, route: ActivatedRouteSnapshot) {
        return component.canDeactive ? component.canDeactive() : true;
    }
}

export interface CanDeactiveComponent {
    canDeactive: () => Observable<boolean> | Promise<boolean> | boolean;
}
