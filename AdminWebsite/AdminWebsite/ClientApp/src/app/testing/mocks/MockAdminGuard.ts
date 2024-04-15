export class MockAdminGuard {
    private _flag: boolean;
    canActivate() {
        return this._flag;
    }
    setflag(flag: boolean) {
        this._flag = flag;
    }
}
