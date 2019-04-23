import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserIdentityService } from '../services/user-identity.service';
import { ErrorService } from '../services/error.service';
import { PageUrls } from '../shared/page-url.constants';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit {

  constructor(
    private router: Router,
    private userIdentityService: UserIdentityService,
    private errorService: ErrorService) { }

  showCheckList = false;
  showBooking = false;

  async ngOnInit() {
    const profile = await this.userIdentityService.getUserInformation().toPromise();
    console.log('case: ' + profile.is_case_administrator);
    this.showCheckList = profile.is_vh_officer_administrator_role;
    console.log('officer: ' + profile.is_vh_officer_administrator_role);
    this.showBooking = profile.is_case_administrator || profile.is_vh_officer_administrator_role;
  }
}
