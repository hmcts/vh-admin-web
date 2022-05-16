import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbItems } from './breadcrumbItems';
import { BreadcrumbItemModel } from './breadcrumbItem.model';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { first } from 'rxjs/operators';
import { FeatureFlagService } from '../../services/feature-flag.service';
import { PageUrls } from '../../shared/page-url.constants';
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
    ejudFeatureFlag = false;
    constructor(private router: Router, private videoHearingsService: VideoHearingsService, private featureService: FeatureFlagService) {
        this.breadcrumbItems = JSON.parse(JSON.stringify(BreadcrumbItems));
    }
    async ngOnInit() {
        this.currentRouter = this.router.url;
        this.featureService
            .getFeatureFlagByName('StaffMemberFeature')
            .pipe(first())
            .subscribe(result => {
                const index = this.breadcrumbItems.findIndex(b => b.Url === PageUrls.AssignJudge);
                if (!result && index !== -1) {
                    this.breadcrumbItems[index].Name = 'Judge';
                }
            });
        await this.featureService
            .getFeatureFlagByName('EJudFeature')
            .pipe(first())
            .toPromise()
            .then(result => {
                this.ejudFeatureFlag = result;
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
        const assignJudgeBehaviourOverride = (item: BreadcrumbItemModel): boolean => {
            if (item.Name !== 'Judge') {
                return false;
            } else {
                return this.ejudFeatureFlag ? !item.LastMinuteAmendable : item.LastMinuteAmendable;
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
