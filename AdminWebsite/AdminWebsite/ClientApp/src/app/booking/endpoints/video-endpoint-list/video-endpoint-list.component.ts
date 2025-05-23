import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VideoAccessPointDto } from '../models/video-access-point.model';

@Component({
    selector: 'app-video-endpoint-list',
    templateUrl: './video-endpoint-list.component.html',
    styleUrl: './video-endpoint-list.component.scss',
    standalone: false
})
export class VideoEndpointListComponent {
    @Input() videoEndpoints: VideoAccessPointDto[];
    @Input() canRemove = true;

    @Output() editEndpoint = new EventEmitter<VideoAccessPointDto>();
    @Output() deleteEndpoint = new EventEmitter<VideoAccessPointDto>();
}
