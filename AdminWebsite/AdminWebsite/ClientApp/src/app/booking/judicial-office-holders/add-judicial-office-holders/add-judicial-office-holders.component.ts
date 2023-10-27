import { Component, OnInit } from '@angular/core';
import { JudicialMemberDto } from '../models/add-judicial-member.model';
import { HearingModel } from 'src/app/common/model/hearing.model';

@Component({
    selector: 'app-add-judicial-office-holders',
    templateUrl: './add-judicial-office-holders.component.html',
    styleUrls: ['./add-judicial-office-holders.component.scss']
})
export class AddJudicialOfficeHoldersComponent implements OnInit {
    judicialOfficeHolders: JudicialMemberDto[] = [];
    judgeAssigned = false;
    displayPanelMember = false;
    hearing: HearingModel;
    // this will be the parent container component
    // holds the add presiding judge and add panel member components
    ngOnInit(): void {
        // init judicial office holders from cache if exists
        this.hearing = new HearingModel();
        this.hearing.judiciaryParticipants = this.judicialOfficeHolders;
    }

    getJudge(): JudicialMemberDto {
        return this.judicialOfficeHolders.find(holder => holder.roleCode === 'Judge');
    }

    addPresidingJudge(judicialMember: JudicialMemberDto) {
        console.log('add presiding judge', judicialMember);
        judicialMember.roleCode = 'Judge';

        const judgeIndex = this.judicialOfficeHolders.findIndex(holder => holder.roleCode === 'Judge');

        if (judgeIndex !== -1) {
            // Judge exists, replace or add entry
            this.judicialOfficeHolders[judgeIndex] = judicialMember;
        } else {
            // Judge does not exist, add entry
            this.judicialOfficeHolders.push(judicialMember);
        }
        this.judgeAssigned = true;
        this.hearing.judiciaryParticipants = this.judicialOfficeHolders;
    }

    removeJudge() {
        const judgeIndex = this.judicialOfficeHolders.findIndex(holder => holder.roleCode === 'Judge');
        if (judgeIndex !== -1) {
            this.judicialOfficeHolders.splice(judgeIndex, 1);
        }
        this.judgeAssigned = true;
        this.hearing.judiciaryParticipants = this.judicialOfficeHolders;
    }

    addPanelMember(judicialMember: JudicialMemberDto) {
        console.log('add panel member', judicialMember);
        judicialMember.roleCode = 'PanelMember';

        if (!this.judicialOfficeHolders.find(holder => holder.personalCode === judicialMember.personalCode)) {
            this.judicialOfficeHolders.push(judicialMember);
        }

        this.hearing.judiciaryParticipants = this.judicialOfficeHolders;
    }
}
