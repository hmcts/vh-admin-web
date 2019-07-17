import { Component, Output, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { ParticipantModel } from '../../common/model/participant.model';

@Component({ selector: 'app-search-email', template: '' })
export class SearchEmailStubComponent {

  @Output()
  findParticipant = new EventEmitter<ParticipantModel>();

  @Output()
  participantsNotFound = new EventEmitter();

  @Output()
  emailChanged = new EventEmitter<string>();

  @ViewChild('emailInput', { static: false })
  emailInput: ElementRef;

  validateEmail() {
    return true;
  }
  clearEmail() {

  }
}
