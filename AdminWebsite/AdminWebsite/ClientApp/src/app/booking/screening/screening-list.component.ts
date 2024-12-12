import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { ParticipantModel } from 'src/app/common/model/participant.model';

@Component({
    selector: 'app-screening-list',
    templateUrl: './screening-list.component.html',
    styleUrls: ['./screening-list.component.scss']
})
export class ScreeningListComponent implements OnChanges {
    participantsWithScreening: ParticipantModel[] = [];
    endpointsWithScreening: EndpointModel[] = [];

    @Input() hearing: VHBooking;
    @Output() deleteEndpointScreening = new EventEmitter<EndpointModel>();
    @Output() deleteParticipantScreening = new EventEmitter<ParticipantModel>();

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hearing) {
            const hearing: VHBooking = changes.hearing.currentValue;
            this.participantsWithScreening = hearing?.participants?.filter(x => x.screening);
            this.endpointsWithScreening = hearing?.endpoints?.filter(x => x.screening);
        }
    }

    onEndpointScreeningDeleted(endpoint: EndpointModel) {
        this.deleteEndpointScreening.emit(endpoint);
    }

    onParticipantScreeningDeleted(participant: ParticipantModel) {
        this.deleteParticipantScreening.emit(participant);
    }
}
