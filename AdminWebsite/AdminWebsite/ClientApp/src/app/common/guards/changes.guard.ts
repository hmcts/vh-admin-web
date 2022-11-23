import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class ChangesGuard implements CanDeactivate<CanDeactiveComponent> {
    canDeactivate(component: CanDeactiveComponent, route: ActivatedRouteSnapshot) {
        return component.canDeactive ? component.canDeactive() : true;
    }
}

export interface CanDeactiveComponent {
    canDeactive: () => Observable<boolean> | Promise<boolean> | boolean;
}
