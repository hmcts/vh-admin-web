import { Component, EventEmitter, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { Logger } from 'src/app/services/logger';

@Component({
    selector: 'app-participant-list',
    templateUrl: './participant-list.component.html',
    styleUrls: ['./participant-list.component.scss']
})
export class ParticipantListComponent implements OnInit, OnChanges {
    private readonly loggerPrefix = '[ParticipantList] -';
    @Input()
    participants: ParticipantModel[] = [];

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
        const judges = this.participants.filter(participant => participant.is_judge);
        const panelMembersAndWingers = this.participants.filter(participant =>
            ['Panel Member', 'Winger'].includes(participant.hearing_role_name)
        );

        const interpretersAndInterpretees = this.getInterpreterAndInterpretees();
        const others = this.participants.filter(
            participant =>
                !participant.is_judge &&
                !['Observer', 'Panel Member', 'Winger'].includes(participant.hearing_role_name) &&
                !interpretersAndInterpretees.includes(participant)
        );
        const observers = this.participants.filter(participant => participant.hearing_role_name === 'Observer');

        this.sortedParticipants = [...judges, ...panelMembersAndWingers, ...others, ...interpretersAndInterpretees, ...observers];
    }

    private getInterpreterAndInterpretees(): ParticipantModel[] {
        const interpreterInterpreteeList: ParticipantModel[] = [];
        // get the interpreter and the corresponding interpretee names.
        this.clearInterpreteeList();
        const interpreter = this.participants.filter(participant => participant.hearing_role_name === 'Interpreter');
        interpreter.forEach(interpreterParticipant => {
            let interpretee: ParticipantModel;
            if (interpreterParticipant.interpreterFor) {
                interpretee = this.participants.find(p => p.email === interpreterParticipant.interpreterFor);
            } else if (interpreterParticipant.linked_participants) {
                const linkedParticipants = interpreterParticipant.linked_participants;
                linkedParticipants.forEach(linkedParticipant => {
                    interpretee = this.participants.find(p => p.id === linkedParticipant.linkedParticipantId);
                });
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
        const interpreteeList: ParticipantModel[] = this.participants.filter(participant => participant.is_interpretee);
        interpreteeList.forEach(i => {
            i.is_interpretee = false;
        });
    }
}
