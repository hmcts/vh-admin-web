import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { ScreeningDto, ScreeningType } from './screening.model';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Component({
    selector: 'app-screening-list-item',
    templateUrl: './screening-list-item.component.html',
    styleUrls: ['./screening-list-item.component.scss']
})
export class ScreeningListItemComponent implements OnChanges {
    @Output() deleteScreening = new EventEmitter<void>();

    @Input() participant: VHParticipant;
    @Input() endpoint: EndpointModel;
    @Input() hearing: VHBooking;

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

    initModelForParticipant(hearing: VHBooking, participant: VHParticipant): ScreeningItemViewModel {
        const protectFromMapped = this.initProtectFromViewModel(hearing, participant.screening);
        return {
            displayName: participant.display_Name,
            measureType: participant.screening?.measureType,
            protectFrom: protectFromMapped
        };
    }

    initModelForEndpoint(hearing: VHBooking, endpoint: EndpointModel): ScreeningItemViewModel {
        const protectFromMapped = this.initProtectFromViewModel(hearing, endpoint.screening);
        return {
            displayName: endpoint.displayName,
            measureType: endpoint.screening?.measureType,
            protectFrom: protectFromMapped
        };
    }

    initProtectFromViewModel(hearing: VHBooking, screening: ScreeningDto): ProtectFromViewModel[] {
        const protectFrom = (screening.protectFrom = screening.protectFrom || []);
        if (protectFrom.length === 0) {
            return [];
        }

        return protectFrom.map(p => {
            const matchedParticipant = hearing.participants.find(x => x.externalReferenceId === p.externalReferenceId);

            if (matchedParticipant) {
                return {
                    contactEmail: matchedParticipant.email,
                    displayName: matchedParticipant.display_Name
                };
            }
            const matchedEndpoint = hearing.endpoints.find(x => x.externalReferenceId === p.externalReferenceId);
            if (matchedEndpoint) {
                return {
                    contactEmail: matchedEndpoint.contactEmail,
                    displayName: matchedEndpoint.displayName
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
