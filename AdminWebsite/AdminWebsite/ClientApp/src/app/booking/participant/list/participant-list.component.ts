import { Component, EventEmitter, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { Logger } from 'src/app/services/logger';
import { HearingModel } from '../../../common/model/hearing.model';

@Component({
    selector: 'app-participant-list',
    templateUrl: './participant-list.component.html',
    styleUrls: ['./participant-list.component.scss']
})
export class ParticipantListComponent implements OnInit, OnChanges {
    private readonly loggerPrefix = '[ParticipantList] -';
    @Input() hearing: HearingModel;

    sortedParticipants: ParticipantModel[] = [];

    $selectedForEdit = new EventEmitter<string>();
    $selectedForRemove = new EventEmitter<string>();

    isSummaryPage = false;
    isEditRemoveVisible = true;
    isEditMode = false;

    constructor(private router: Router, private logger: Logger) {}

    ngOnChanges() {
        this.sortParticipants();
    }

    ngOnInit() {
        const currentUrl = this.router.url;
        if (currentUrl) {
            this.isSummaryPage = currentUrl.includes('summary');
            this.isEditRemoveVisible = !currentUrl.includes('assign-judge');
        }
        this.sortParticipants();
    }

    editParticipant(participant: ParticipantModel) {
        this.$selectedForEdit.emit(participant.email);
    }

    removeParticipant(participant: ParticipantModel) {
        this.$selectedForRemove.emit(participant.email);
    }

    get selectedParticipant() {
        return this.$selectedForEdit;
    }

    get selectedParticipantToRemove() {
        return this.$selectedForRemove;
    }

    private sortParticipants() {
        const judges = this.hearing.participants.filter(participant => participant.is_judge);
        const panelMembersAndWingers = this.hearing.participants.filter(participant =>
            ['Panel Member', 'Winger'].includes(participant.hearing_role_name)
        );
        const others = this.hearing.participants.filter(
            participant => !participant.is_judge && !['Observer', 'Panel Member', 'Winger'].includes(participant.hearing_role_name)
        );
        const observers = this.hearing.participants.filter(participant => participant.hearing_role_name === 'Observer');

        this.sortedParticipants = [...judges, ...panelMembersAndWingers, ...others, ...observers];
    }
}
