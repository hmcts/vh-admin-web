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

  ngOnInit() {
    this.userIdentityService.getUserInformation()
      .subscribe(
        s => {
          this.showCheckList = s.is_vh_officer_administrator_role;
          this.showBooking = s.is_case_administrator || s.is_vh_officer_administrator_role;
          if (!this.showCheckList && !this.showBooking) {
            this.router.navigate([PageUrls.Unauthorised]);
          }
        },
        error => {
          this.errorService.handleError(error);
        }
      );
  }
}
