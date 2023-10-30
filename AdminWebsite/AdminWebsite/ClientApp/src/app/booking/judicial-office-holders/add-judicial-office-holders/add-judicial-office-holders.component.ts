import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { JudicialMemberDto } from '../models/add-judicial-member.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantListComponent } from '../../participant';
import { Subject, takeUntil } from 'rxjs';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Router } from '@angular/router';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';

@Component({
    selector: 'app-add-judicial-office-holders',
    templateUrl: './add-judicial-office-holders.component.html',
    styleUrls: ['./add-judicial-office-holders.component.scss']
})
export class AddJudicialOfficeHoldersComponent implements OnInit, OnDestroy {
    judgeAssigned = false;
    displayPanelMember = false;
    hearing: HearingModel;

    destroyed$ = new Subject<void>();

    @ViewChild(ParticipantListComponent, { static: true })
    participantsListComponent: ParticipantListComponent;

    private readonly loggerPrefix: string = '[Booking] Assign JOH -';

    constructor(private router: Router, private hearingService: VideoHearingsService, private logger: Logger) {}

    ngOnInit(): void {
        // init judicial office holders from cache if exists
        this.hearing = this.hearingService.getCurrentRequest();
        // this.judicialOfficeHolders = this.hearing.judiciaryParticipants ?? [];
        this.participantsListComponent.selectedParticipantToRemove.pipe(takeUntil(this.destroyed$)).subscribe(participantEmail => {
            this.removeJudiciaryParticipant(participantEmail);
        });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    getJudge(): JudicialMemberDto {
        return this.hearing.judiciaryParticipants.find(holder => holder.roleCode === 'Judge');
    }

    addPresidingJudge(judicialMember: JudicialMemberDto) {
        console.log('add presiding judge', judicialMember);
        judicialMember.roleCode = 'Judge';

        this.hearingService.addJudiciaryJudge(judicialMember);

        this.judgeAssigned = true;
        // this.hearing.judiciaryParticipants = this.judicialOfficeHolders;
    }

    removeJudge() {
        this.hearingService.removeJudiciaryJudge();
        this.judgeAssigned = true;
    }

    removeJudiciaryParticipant(participantEmail: string) {
        this.hearingService.removeJudiciaryParticipant(participantEmail);
    }

    addPanelMember(judicialMember: JudicialMemberDto) {
        console.log('add panel member', judicialMember);
        judicialMember.roleCode = 'PanelMember';

        if (!this.hearing.judiciaryParticipants.find(holder => holder.personalCode === judicialMember.personalCode)) {
            this.hearing.judiciaryParticipants.push(judicialMember);
        }
    }

    continueToNextStep() {
        this.hearingService.updateHearingRequest(this.hearing);
        this.logger.debug(`${this.loggerPrefix} Navigating to add participants.`);
        this.router.navigate([PageUrls.AddParticipants]);
    }
}
