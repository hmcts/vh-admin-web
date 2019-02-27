import { Router, ResolveEnd, ActivatedRouteSnapshot, NavigationEnd } from "@angular/router";
import { AppInsightsLogger } from "./app-insights-logger.service";
import { Injectable } from "@angular/core";
import 'rxjs/add/operator/pairwise';

@Injectable()
export class PageTrackerService {

  PREVIOUS_ROUTE:string = 'PREVIOUS_ROUTE';

  constructor(private logger: AppInsightsLogger) { } //, private sessionStorage: SessionStorage) {}

  trackNavigation(router: Router) {
    router.events
      .filter(event => event instanceof ResolveEnd)
      .subscribe((event: ResolveEnd) => this.logPageResolved(event));
  }

  trackPreviousPage(router: Router) {
    router.events.filter(e => e instanceof NavigationEnd)
      .pairwise().subscribe((e) => {
        sessionStorage.setItem(this.PREVIOUS_ROUTE, e[0]['url']);
        console.log('NAVIGATION PREVIOUS => ', e[0]['url']);
      });
  }

  getPreviousUrl() {
    return sessionStorage.getItem(this.PREVIOUS_ROUTE);
  }

  private logPageResolved(event: ResolveEnd): void {
    const activatedComponent = this.getActivatedComponent(event.state.root);
    if (activatedComponent) {
      this.logger.trackPage(`${activatedComponent.name} ${this.getRouteTemplate(event.state.root)}`, event.urlAfterRedirects);
    }
  }
  
  private getActivatedComponent(snapshot: ActivatedRouteSnapshot): any {
    if (snapshot.firstChild) {
      return this.getActivatedComponent(snapshot.firstChild);
    }

    return snapshot.component;
  }
  
  private getRouteTemplate(snapshot: ActivatedRouteSnapshot): string {
    let path = snapshot.routeConfig ? snapshot.routeConfig.path : '';

    if (snapshot.firstChild) {
      return path + '/' + this.getRouteTemplate(snapshot.firstChild);
    }

    return path;
  }
}
