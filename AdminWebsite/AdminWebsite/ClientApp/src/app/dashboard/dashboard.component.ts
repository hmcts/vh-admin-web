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
    await this.userIdentityService.getUserInformation().toPromise()
      .then(result => {
        this.showCheckList = result.is_vh_officer_administrator_role;
        this.showBooking = result.is_case_administrator || result.is_vh_officer_administrator_role;
      })
      .catch(error => {
        this.errorService.handleError(error);
      });
  }
}
