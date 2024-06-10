import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbItems } from './breadcrumbItems';
import { BreadcrumbItemModel } from './breadcrumbItem.model';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { Subject } from 'rxjs';
import { LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
    breadcrumbItems: BreadcrumbItemModel[];
    currentRouter: string;
    currentItem: BreadcrumbItemModel;
    @Input()
    canNavigate: boolean;
    destroyed$ = new Subject<void>();

    constructor(private router: Router, private videoHearingsService: VideoHearingsService, private featureService: LaunchDarklyService) {}

    ngOnInit() {
        this.currentRouter = this.router.url;
        this.breadcrumbItems = BreadcrumbItems.filter(x => x.Url !== PageUrls.AssignJudge);
        this.initBreadcrumb();
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    clickBreadcrumbs(step: BreadcrumbItemModel) {
        const nextItem = this.breadcrumbItems.find(s => s.Url === step.Url);
        if (!nextItem) {
            return;
        }
        if (!this.currentItem) {
            this.initBreadcrumb();
        }
        if (nextItem && nextItem.Id < this.currentItem.Id) {
            this.router.navigate([nextItem.Url]);
            return;
        }
        if (nextItem.Id - this.currentItem.Id === 1 && this.canNavigate) {
            this.router.navigate([nextItem.Url]);
            return;
        }
        if (this.canNavigate) {
            if (this.videoHearingsService.validCurrentRequest()) {
                this.router.navigate([nextItem.Url]);
            }
        }
    }
    private initBreadcrumb() {
        const assignJudgeBehaviourOverride = (item: BreadcrumbItemModel): boolean => {
            if (item.Name !== 'Judge') {
                return false;
            } else {
                return !item.LastMinuteAmendable;
            }
        };
        this.currentItem = this.breadcrumbItems.find(s => s.Url === this.currentRouter);
        if (this.currentItem) {
            for (const item of this.breadcrumbItems) {
                item.Value = item.Url === this.currentRouter;
                if (
                    !this.videoHearingsService.isConferenceClosed() &&
                    this.videoHearingsService.isHearingAboutToStart() &&
                    (assignJudgeBehaviourOverride(item) || !item.LastMinuteAmendable)
                ) {
                    item.Active = false;
                } else {
                    item.Active = item.Id <= this.currentItem.Id;
                }
            }
        }
    }
}
