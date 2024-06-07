import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VideoAccessPointDto } from '../models/video-access-point.model';
import { LinkedParticipantType } from 'src/app/common/model/linked-participant.model';

@Component({
    selector: 'app-video-endpoint-list',
    templateUrl: './video-endpoint-list.component.html',
    styleUrl: './video-endpoint-list.component.scss'
})
export class VideoEndpointListComponent {
    @Input() videoEndpoints: VideoAccessPointDto[];
    @Input() canRemove = true;

    @Output() editEndpoint = new EventEmitter<VideoAccessPointDto>();
    @Output() deleteEndpoint = new EventEmitter<VideoAccessPointDto>();
}
