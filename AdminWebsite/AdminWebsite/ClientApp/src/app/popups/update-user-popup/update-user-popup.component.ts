import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Logger } from 'src/app/services/logger';

@Component({
    selector: 'app-update-user-popup',
    templateUrl: './update-user-popup.component.html'
})
export class UpdateUserPopupComponent {
    private readonly loggerPrefix = '[UpdateUserPopup] -';
    @Input() message: string;
    @Output() okay: EventEmitter<any> = new EventEmitter<any>();

    constructor(private readonly logger: Logger) {}

    okayClose(): void {
        this.logger.debug(`${this.loggerPrefix} Clicked okay`);
        this.okay.emit();
    }
}
