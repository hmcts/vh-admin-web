import { CanDeactiveComponent } from 'src/app/common/guards/changes.guard';
export class MockChangesGuard {
    private _flag: boolean;
    canDeactivate() {
        return this._flag;
    }
    setflag(flag: boolean) {
        this._flag = flag;
    }
}
