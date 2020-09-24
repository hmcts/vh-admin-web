export class MultiAudioLinkModel {
    constructor(linkIndex, selected) {
        this.linkIndex = linkIndex;
        this.selected = selected;
    }

    linkIndex: number;
    selected: boolean;
}
