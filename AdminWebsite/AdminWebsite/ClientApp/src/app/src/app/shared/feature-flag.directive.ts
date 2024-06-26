import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

import { Subscription } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

@Directive({
    selector: '[appFeatureFlag]'
})
export class FeatureFlagDirective {
    private subscription: Subscription;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private launchDarklyService: LaunchDarklyService
    ) {}

    @Input() set appFeatureFlag(flagKey: keyof typeof FeatureFlags) {
        this.subscription?.unsubscribe();

        this.subscription = this.launchDarklyService.getFlag<boolean>(flagKey).subscribe(flagValue => {
            if (flagValue) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            } else {
                this.viewContainer.clear();
            }
        });
    }
}
