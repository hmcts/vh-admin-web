import { Component, Input, OnInit, EventEmitter } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { ParticipantModel } from '../../common/model/participant.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-participants-list',
  templateUrl: './participants-list.component.html',
  styleUrls: ['./participants-list.component.css']
})
export class ParticipantsListComponent implements OnInit{

  @Input()
  participants: ParticipantModel[];
 
  $selectedForEdit: EventEmitter<string>;
  $selectedForRemove: EventEmitter<string>;

  isSummaryPage: boolean = false;
  isEditRemoveVisible: boolean = true;

  constructor(private bookingService: BookingService, private router: Router) {
    this.$selectedForEdit = new EventEmitter<string>();
    this.$selectedForRemove = new EventEmitter<string>();
  }

  ngOnInit() {
    this.isSummaryPage = this.router.url.includes('summary');
    this.isEditRemoveVisible = !this.router.url.includes('assign-judge')
  }
  editJudge() {
    this.bookingService.setEditMode();
  }

  editParticipant(participantEmail:string) {
    this.bookingService.setEditMode();
    if (this.isSummaryPage) {
      this.bookingService.setParticipantEmail(participantEmail);
      this.router.navigate(['/add-participants']);
    } else {
      //we are om the add participant page
      this.$selectedForEdit.emit(participantEmail);
    }
  }

  removeParticipant(participantEmail: string) {
    this.$selectedForRemove.emit(participantEmail);
  }

  get selectedParticipant() {
    return this.$selectedForEdit;
  }

  get selectedParticipantToRemove() {
    return this.$selectedForRemove;
  }
}
