import { Component, ElementRef, EventEmitter, HostListener, Output, ViewChild, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { PersonResponse } from '../../services/clients/api-client';
import { Constants } from '../../common/constants';
import { ParticipantModel } from '../../common/model/participant.model';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-search-email',
  templateUrl: './search-email.component.html',
  styleUrls: ['./search-email.component.css'],
  providers: [SearchService]
})
export class SearchEmailComponent implements OnInit {
  constants = Constants;
  participantDetails: ParticipantModel;
  searchTerm = new Subject<string>();
  results: ParticipantModel[] = [];
  isShowResult = false;
  notFoundParticipant = false;
  email = '';
  isValidEmail = true;
  @Output()
  findParticipant = new EventEmitter<ParticipantModel>();

  @Output()
  participantsNotFound = new EventEmitter();

  @Output()
  emailChanged = new EventEmitter<string>();

  @ViewChild('emailInput')
  emailInput: ElementRef;

  constructor(private searchService: SearchService, private elRef: ElementRef) {
  }

  ngOnInit() {
    this.searchService.search(this.searchTerm)
      .subscribe(data => {
        if (data && data.length > 0) {
          this.getData(data);
        } else {
          this.noDataFound();
        }
      });

    this.searchTerm.subscribe(s => this.email = s);
  }

  getData(data: PersonResponse[]) {
    this.results = data.map(x => this.mapPersonResponseToParticipantModel(x));
    this.isShowResult = true;
    this.isValidEmail = true;
    this.notFoundParticipant = false;
  }

  noDataFound() {
    this.isShowResult = false;
    this.notFoundParticipant = true;
    this.participantsNotFound.emit();
  }

  selectItemClick(result: ParticipantModel) {
    this.email = result.email;

    const selectedResult = new ParticipantModel();
    selectedResult.email = result.email;
    selectedResult.first_name = result.first_name;
    selectedResult.last_name = result.last_name;
    selectedResult.title = result.title;
    selectedResult.phone = result.phone;
    selectedResult.company = result.company;
    selectedResult.housenumber = result.housenumber;
    selectedResult.street = result.street;
    selectedResult.city = result.city;
    selectedResult.county = result.county;
    selectedResult.postcode = result.postcode;
    selectedResult.is_exist_person = true;
    this.isShowResult = false;
    this.findParticipant.emit(selectedResult);
    this.setEmailDisabled(true);
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

  setEmailDisabled(value: boolean) {
    if (!value) {
      this.emailInput.nativeElement.removeAttribute('disabled');
    } else {
      setTimeout(() => {
        this.emailInput.nativeElement.setAttribute('disabled', 'true');
      }, 500);
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

  mapPersonResponseToParticipantModel(p: PersonResponse): ParticipantModel {
    let participant: ParticipantModel;
    if (p) {
      participant = new ParticipantModel();
      participant.id = p.id;
      participant.title = p.title;
      participant.first_name = p.first_name;
      participant.middle_names = p.middle_names;
      participant.last_name = p.last_name;
      participant.username = p.username;
      participant.email = p.contact_email;
      participant.phone = p.telephone_number;
      participant.representee = '';
      participant.solicitorsReference = '';
      participant.company = p.organisation;
      participant.housenumber = p.house_number;
      participant.street = p.street;
      participant.city = p.city;
      participant.county = p.county;
      participant.postcode = p.postcode;
    }

    return participant;
  }
}
