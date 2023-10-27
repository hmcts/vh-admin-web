import { Component, OnInit } from '@angular/core';
import { JudicialMemberDto } from '../models/add-judicial-member.model';

@Component({
    selector: 'app-add-judicial-office-holders',
    templateUrl: './add-judicial-office-holders.component.html',
    styleUrls: ['./add-judicial-office-holders.component.scss']
})
export class AddJudicialOfficeHoldersComponent implements OnInit {
    judicialOfficeHolders: JudicialMemberDto[] = [];
    // this will be the parent container component
    // holds the add presiding judge and add panel member components
    ngOnInit(): void {
        // init judicial office holders from cache if exists
    }

    addPresidingJudge(judicialMember: JudicialMemberDto) {}

    addPanelMember(judicialMember: JudicialMemberDto) {}
}
