import { ClipboardService } from 'ngx-clipboard';

export abstract class CopyDetailsBase {
    displayTooltip: boolean;
    tooltip: string;
    elem: HTMLDivElement;
    _detailsToCopy: string;
    tooltipTextCopied: string;
    tooltipTextCopy: string;

    constructor(protected clipboardService: ClipboardService) {
        this.displayTooltip = true;
    }

    mouseOver($event: MouseEvent): void {
        if (!this.elem) {
            return;
        }
        const x = $event.clientX;
        const y = $event.clientY;

        this.elem.style.top = y + 15 + 'px';
        this.elem.style.left = x + 20 + 'px';
        this.setTooltipVisibility(false);
    }

    copyToClipboard() {
        this.clipboardService.copyFromContent(this._detailsToCopy);
        this.tooltip = this.tooltipTextCopied;
        this.setTooltipVisibility(false);
        setTimeout(() => {
            this.tooltip = this.tooltipTextCopy;
        }, 3000);
    }

    onMouseOut(): void {
        this.setTooltipVisibility(true);
    }

    setTooltipVisibility(visible: boolean) {
        this.displayTooltip = visible;
    }
}
