import { Component, EventEmitter, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { LinkedParticipantType } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { HearingModel } from '../../../common/model/hearing.model';

@Component({
    selector: 'app-participant-list',
    templateUrl: './participant-list.component.html',
    styleUrls: ['./participant-list.component.scss']
})
export class ParticipantListComponent implements OnInit, OnChanges {
    @Input() hearing: HearingModel;

    sortedParticipants: ParticipantModel[] = [];

    $selectedForEdit = new EventEmitter<string>();
    $selectedForRemove = new EventEmitter<string>();

    isSummaryPage = false;
    isEditMode = false;

    constructor(
        private router: Router,
        private logger: Logger,
        private videoHearingsService: VideoHearingsService,
        ) {}

    ngOnChanges() {
        this.sortParticipants();
    }

    ngOnInit() {
        const currentUrl = this.router.url;
        if (currentUrl) {
            this.isSummaryPage = currentUrl.includes('summary');
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
        if (!this.hearing.participants) {
            this.sortedParticipants = [];
            return;
        }
        const judges = this.hearing.participants.filter(participant => participant.is_judge);
        const panelMembersAndWingers = this.hearing.participants.filter(participant =>
            ['Panel Member', 'Winger'].includes(participant.hearing_role_name)
        );

        const interpretersAndInterpretees = this.getInterpreterAndInterpretees();
        const others = this.hearing.participants.filter(
            participant =>
                !participant.is_judge &&
                !['Observer', 'Panel Member', 'Winger'].includes(participant.hearing_role_name) &&
                !interpretersAndInterpretees.includes(participant)
        );
        const observers = this.hearing.participants.filter(
            participant => participant.hearing_role_name === 'Observer' && !interpretersAndInterpretees.includes(participant)
        );

        this.sortedParticipants = [...judges, ...panelMembersAndWingers, ...others, ...interpretersAndInterpretees, ...observers];
    }

    private getInterpreterAndInterpretees(): ParticipantModel[] {
        const interpreterInterpreteeList: ParticipantModel[] = [];
        // get the interpreter and the corresponding interpretee names.
        this.clearInterpreteeList();
        const interpreter = this.hearing.participants.filter(participant => participant.hearing_role_name === 'Interpreter');
        interpreter.forEach(interpreterParticipant => {
            let interpretee: ParticipantModel;
            if (interpreterParticipant.interpreterFor) {
                interpretee = this.hearing.participants.find(p => p.email === interpreterParticipant.interpreterFor);
            } else if (interpreterParticipant.linked_participants) {
                const linkedParticipants = interpreterParticipant.linked_participants;
                interpretee = this.hearing.participants.find(p =>
                    linkedParticipants.some(lp => lp.linkedParticipantId === p.id && lp.linkType === LinkedParticipantType.Interpreter)
                );
            }
            interpreterParticipant.interpretee_name = interpretee?.display_name;
            interpreterInterpreteeList.push(interpreterParticipant);

            if (interpretee) {
                interpretee.is_interpretee = true;
                interpreterInterpreteeList.push(interpretee);
            }
        });
        return interpreterInterpreteeList;
    }

    private clearInterpreteeList(): void {
        const interpreteeList: ParticipantModel[] = this.hearing.participants.filter(participant => participant.is_interpretee);
        interpreteeList.forEach(i => {
            i.is_interpretee = false;
        });
    }

    canEditParticipant(particpant: ParticipantModel): boolean {
        if (this.router.url.includes('assign-judge')) {
            return false;
        } else if (this.videoHearingsService.isConferenceClosed()) {
            return false;
        } else if (this.videoHearingsService.isHearingAboutToStart()) {
            if (particpant.addedDuringHearing) {
                return true;
            } else { return false; }
        } else { return true; }
    }
}
