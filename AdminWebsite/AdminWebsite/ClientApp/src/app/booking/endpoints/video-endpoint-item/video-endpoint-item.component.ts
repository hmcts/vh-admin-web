import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EndpointLink, VideoAccessPointDto } from '../models/video-access-point.model';
import { InterpreterSelectedDto } from '../../interpreter-form/interpreter-selected.model';

@Component({
    selector: 'app-video-endpoint-item',
    templateUrl: './video-endpoint-item.component.html',
    styleUrl: './video-endpoint-item.component.scss',
    standalone: false
})
export class VideoEndpointItemComponent {
    @Input() set videoEndpoint(videoEndpoint: VideoAccessPointDto) {
        this._videoEndpoint = videoEndpoint;
        this.displayName = videoEndpoint.displayName;
        this.linkedRepresentative = videoEndpoint.defenceAdvocate;
        this.interpretationLanguage = videoEndpoint.interpretationLanguage;
    }

    @Input() displayRemoveButton = true;

    @Output() editEndpoint = new EventEmitter<VideoAccessPointDto>();
    @Output() deleteEndpoint = new EventEmitter<VideoAccessPointDto>();

    displayName: string;
    linkedRepresentative: EndpointLink;
    interpretationLanguage: InterpreterSelectedDto;

    private _videoEndpoint: VideoAccessPointDto;

    edit() {
        this.editEndpoint.emit(this._videoEndpoint);
    }

    delete() {
        this.deleteEndpoint.emit(this._videoEndpoint);
    }
}
