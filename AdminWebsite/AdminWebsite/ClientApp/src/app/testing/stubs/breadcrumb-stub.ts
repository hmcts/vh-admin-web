import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-breadcrumb', template: '',
    standalone: false
})
export class BreadcrumbStubComponent {
    @Input()
    canNavigate = true;
}
