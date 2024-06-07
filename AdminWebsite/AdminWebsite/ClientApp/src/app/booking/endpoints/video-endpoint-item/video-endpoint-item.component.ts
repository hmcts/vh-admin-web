import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EndpointLink, VideoAccessPointDto } from '../models/video-access-point.model';

@Component({
    selector: 'app-video-endpoint-item',
    templateUrl: './video-endpoint-item.component.html',
    styleUrl: './video-endpoint-item.component.scss'
})
export class VideoEndpointItemComponent {
    @Input() set videoEndpoint(videoEndpoint: VideoAccessPointDto) {
        this._videoEndpoint = videoEndpoint;
        this.displayName = videoEndpoint.displayName;
        this.linkedRepresentative = videoEndpoint.defenceAdvocate;
    }

    @Input() displayRemoveButton = true;

    @Output() editEndpoint = new EventEmitter<VideoAccessPointDto>();
    @Output() deleteEndpoint = new EventEmitter<VideoAccessPointDto>();

    displayName: string;
    linkedRepresentative: EndpointLink;

    private _videoEndpoint: VideoAccessPointDto;

    edit() {
        this.editEndpoint.emit(this._videoEndpoint);
    }

    delete() {
        this.deleteEndpoint.emit(this._videoEndpoint);
    }
}
