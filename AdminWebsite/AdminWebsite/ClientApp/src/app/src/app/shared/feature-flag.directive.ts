import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

import { Subscription } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

@Directive({
    selector: '[appFeatureFlag]',
    standalone: false
})
export class FeatureFlagDirective {
    private subscription: Subscription;

    constructor(
        private readonly templateRef: TemplateRef<any>,
        private readonly viewContainer: ViewContainerRef,
        private readonly launchDarklyService: LaunchDarklyService
    ) {}

    @Input() set appFeatureFlag(flagKey: keyof typeof FeatureFlags) {
        this.subscription?.unsubscribe();

        this.subscription = this.launchDarklyService.getFlag<boolean>(flagKey).subscribe({
            next: flagValue => (flagValue ? this.showContent() : this.hideContent())
        });
    }

    private showContent(): void {
        this.viewContainer.createEmbeddedView(this.templateRef);
    }

    private hideContent(): void {
        this.viewContainer.clear();
    }
}
