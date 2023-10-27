import { Component, EventEmitter, Output } from '@angular/core';
import { JudicialMemberDto } from '../models/add-judicial-member.model';

@Component({
    selector: 'app-add-judicial-presiding-judge-form',
    templateUrl: './add-judicial-presiding-judge-form.component.html',
    styleUrls: ['./add-judicial-presiding-judge-form.component.scss']
})
export class AddJudicialPresidingJudgeFormComponent {
    @Output() judgeAdded: EventEmitter<JudicialMemberDto> = new EventEmitter<JudicialMemberDto>();
}
