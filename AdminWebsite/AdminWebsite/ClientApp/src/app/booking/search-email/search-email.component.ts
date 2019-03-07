import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { Subject } from 'rxjs';

import { Constants } from '../../common/constants';
import { ParticipantModel } from '../../common/model/participant.model';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-search-email',
  templateUrl: './search-email.component.html',
  styleUrls: ['./search-email.component.css'],
  providers: [SearchService]
})
export class SearchEmailComponent {
  constants = Constants;
  participantDetails: ParticipantModel;
  searchTerm = new Subject<string>();
  results: Object;
  isShowResult = false;
  notFoundParticipant = false;
  email = '';
  isValidEmail = true;
  searchService: SearchService;

  @Output()
  findParticipant = new EventEmitter<ParticipantModel>();

  @Output()
  participantsNotFound = new EventEmitter();

  @Output()
  emailChanged = new EventEmitter<string>();

  constructor(searchService: SearchService, private elRef: ElementRef) {
    this.searchService = searchService;
    this.searchService.search(this.searchTerm)
      .subscribe(data => {
        this.results = data;
        if (this.results) {
          this.isShowResult = true;
          this.isValidEmail = true;
          this.notFoundParticipant = false;
        } else {
          this.isShowResult = false;
          this.notFoundParticipant = true;
          return this.participantsNotFound.emit();
        }
      });

    this.searchTerm.subscribe(s => this.email = s);
  }

  selectItemClick(result: ParticipantModel) {
    this.email = result.email;

    const selectedResult = new ParticipantModel();
    selectedResult.email = result.email;
    selectedResult.first_name = result.first_name;
    selectedResult.last_name = result.last_name;
    selectedResult.title = result.title;
    selectedResult.role = result.role;
    selectedResult.phone = result.phone;
    selectedResult.display_name = result.display_name;

    this.isShowResult = false;
    return this.findParticipant.emit(selectedResult);
  }

  validateEmail() {

    /* tslint:disable: max-line-length */
    const pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    this.isValidEmail = this.email && this.email.length > 0 && pattern.test(this.email.toLowerCase());
    return this.isValidEmail;
  }

  @HostListener('document:click', ['$event.target'])
   clickedOutside(targetElement) {
    const clickedInside = this.elRef.nativeElement.contains(targetElement);
      if (!clickedInside) {
          this.isShowResult = false;
      }
}

  clearEmail() {
    this.email = '';
    this.isValidEmail = true;
    this.notFoundParticipant = false;
  }

  blurEmail() {
    if (!this.results) {
      this.validateEmail();
      this.emailChanged.emit(this.email);
      this.notFoundParticipant = false;
    }
  }
}
