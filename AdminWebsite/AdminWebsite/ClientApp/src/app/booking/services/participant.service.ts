import { Injectable } from '@angular/core';
import { ParticipantModel } from '../../common/model/participant.model';
import { HearingModel, FeedModel } from '../../common/model/hearing.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {

  constructor() { }

  public checkDuplication(email: string, participants:ParticipantModel[]) :boolean{
    if (!email) throw new Error(`Cannot check for duplication on undefined email`);
    let existParticipant = false;
    if (participants.length > 0) {
      const part = participants.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (part) {
        existParticipant = true;
      }
    }
    return existParticipant;
  }

  public getAllParticipants(hearing:HearingModel): ParticipantModel[] {
    console.debug('getting all participants...');
    console.debug(hearing.feeds);
    let participants: ParticipantModel[] = [];
    hearing.feeds.forEach(x => {
      if (x.participants && x.participants.length >= 1) {
        participants = participants.concat(x.participants);
      }
    });
    return participants;
  }

  public removeParticipant(participants: ParticipantModel[], hearing:HearingModel, email:string) {
    let indexOfParticipant = participants.findIndex(x => x.email.toLowerCase() === email.toLowerCase());
    if (indexOfParticipant > -1) {
      participants.splice(indexOfParticipant, 1);
    }
    this.removeFromFeed(hearing, email);
  }

  private removeFromFeed(hearing: HearingModel, email:string) {
    let indexOfParticipant = hearing.feeds.findIndex(x => x.participants.filter(y => y.email.toLowerCase() === email.toLowerCase()).length > 0);
    if (indexOfParticipant > -1) {
      hearing.feeds.splice(indexOfParticipant, 1);
    }
  }

  public addToFeed(newParticipant: ParticipantModel, hearing:HearingModel){
    let participantFeed = this.getExistingFeedWith(newParticipant.email, hearing);
    if (participantFeed) {
      participantFeed.participants = [];
      participantFeed.location = newParticipant.email;
    } else {
      participantFeed = new FeedModel(newParticipant.email);
      if (hearing.feeds) {
        hearing.feeds.push(participantFeed);
      }
    }
    participantFeed.participants.push(newParticipant);

  }

  private getExistingFeedWith(email: string, hearing:HearingModel): FeedModel {
    return hearing.feeds ?
      hearing.feeds.find(x => x.participants.filter(y => y.email.toLowerCase() === email.toLowerCase()).length > 0)
      : null;
  }
}
