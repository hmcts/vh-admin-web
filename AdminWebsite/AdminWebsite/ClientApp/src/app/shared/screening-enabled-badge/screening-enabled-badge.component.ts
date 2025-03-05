import { Component, Input } from '@angular/core';
import { faUserShield } from '@fortawesome/free-solid-svg-icons';
import { ScreeningDto } from 'src/app/booking/screening/screening.model';

@Component({
    selector: 'app-screening-enabled-badge',
    templateUrl: './screening-enabled-badge.component.html',
    standalone: false
})
export class ScreeningEnabledBageComponent {
    @Input() screening: ScreeningDto;

    faScreeningIcon = faUserShield;
}
