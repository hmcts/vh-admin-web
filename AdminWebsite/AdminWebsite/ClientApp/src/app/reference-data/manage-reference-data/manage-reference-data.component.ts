import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-manage-reference-data',
    templateUrl: './manage-reference-data.component.html',
    styleUrl: './manage-reference-data.component.scss'
})
export class ManageReferenceDataComponent implements OnInit, OnDestroy {
    fragment: string;

    private unsubscribe$ = new Subject<void>();
    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.route.fragment.pipe(takeUntil(this.unsubscribe$)).subscribe(fragment => {
            this.fragment = fragment ?? 'languages';
        });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
