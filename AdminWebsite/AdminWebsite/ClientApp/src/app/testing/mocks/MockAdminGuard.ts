import { CanActivate } from '@angular/router';
export class MockAdminGuard implements CanActivate {
  private _flag: boolean;
  canActivate() {
    return this._flag;
  }
  setflag(flag: boolean) {
    this._flag = flag;
  }
}
