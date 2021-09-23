import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { BreadcrumbItemModel } from './breadcrumbItem.model';
import { BreadcrumbItems } from './breadcrumbItems';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { FeatureFlagService } from 'src/app/services/feature-flag.service';
import { first } from 'rxjs/operators';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {
    breadcrumbItems: BreadcrumbItemModel[];
    currentRouter: string;
    currentItem: BreadcrumbItemModel;

    @Input()
    canNavigate: boolean;

    constructor(private router: Router, private videoHearingsService: VideoHearingsService, private featureService: FeatureFlagService) {}

    ngOnInit() {
        this.currentRouter = this.router.url;
        this.breadcrumbItems = BreadcrumbItems;

        this.featureService
            .getFeatureFlagByName('StaffMemberFeature')
            .pipe(first())
            .subscribe(result => {
                const index = this.breadcrumbItems.findIndex(b => b.Url === PageUrls.AssignJudge);
                if (!result && index !== -1) {
                    this.breadcrumbItems[index].Name = 'Judge';
                }
            });
        this.initBreadcrumb();
    }

    clickBreadcrumbs(step: BreadcrumbItemModel) {
        const nextItem = this.breadcrumbItems.find(s => s.Url === step.Url);
        if (!nextItem) {
            return;
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
            return;
        }
    }

    private initBreadcrumb() {
        this.currentItem = this.breadcrumbItems.find(s => s.Url === this.currentRouter);
        if (this.currentItem) {
            for (const item of this.breadcrumbItems) {
                item.Value = item.Url === this.currentRouter;
                if (
                    !this.videoHearingsService.isConferenceClosed() &&
                    this.videoHearingsService.isHearingAboutToStart() &&
                    !item.LastMinuteAmendable
                ) {
                    item.Active = false;
                } else {
                    item.Active = item.Id <= this.currentItem.Id;
                }
            }
        }
    }
}
