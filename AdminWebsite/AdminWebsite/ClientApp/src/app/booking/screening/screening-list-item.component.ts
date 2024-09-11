import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { ScreeningDto, ScreeningType } from './screening.model';
import { EndpointModel } from 'src/app/common/model/endpoint.model';

@Component({
    selector: 'app-screening-list-item',
    templateUrl: './screening-list-item.component.html',
    styleUrls: ['./screening-list-item.component.scss']
})
export class ScreeningListItemComponent implements OnChanges {
    @Output() deleteScreening = new EventEmitter<void>();

    @Input() participant: ParticipantModel;
    @Input() endpoint: EndpointModel;
    @Input() hearing: HearingModel;

    model: ScreeningItemViewModel;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hearing || changes.participant || changes.endpoint) {
            if (this.participant && this.hearing) {
                this.model = this.initModelForParticipant(this.hearing, this.participant);
            }
            if (this.endpoint && this.hearing) {
                this.model = this.initModelForEndpoint(this.hearing, this.endpoint);
            }
        }
    }

    initModelForParticipant(hearing: HearingModel, participant: ParticipantModel): ScreeningItemViewModel {
        const protectFromMapped = this.initProtectFromViewModel(hearing, participant.screening);
        return {
            displayName: participant.display_name,
            measureType: participant.screening?.measureType,
            protectFrom: protectFromMapped
        };
    }

    initModelForEndpoint(hearing: HearingModel, endpoint: EndpointModel): ScreeningItemViewModel {
        const protectFromMapped = this.initProtectFromViewModel(hearing, endpoint.screening);
        return {
            displayName: endpoint.displayName,
            measureType: endpoint.screening?.measureType,
            protectFrom: protectFromMapped
        };
    }

    initProtectFromViewModel(hearing: HearingModel, screening: ScreeningDto): ProtectFromViewModel[] {
        return screening.protectFrom.map(p => {
            if (p.endpointDisplayName) {
                return {
                    contactEmail: p.participantContactEmail,
                    displayName: p.endpointDisplayName
                };
            }
            if (p.participantContactEmail) {
                const matchedParticipant = hearing.participants.find(x => x.email === p.participantContactEmail);
                return {
                    contactEmail: p.participantContactEmail,
                    displayName: matchedParticipant.display_name
                };
            }
        });
    }

    delete() {
        this.deleteScreening.emit();
    }
}

interface ScreeningItemViewModel {
    displayName: string;
    measureType: ScreeningType;
    protectFrom: ProtectFromViewModel[];
}

interface ProtectFromViewModel {
    contactEmail: string;
    displayName: string;
}
