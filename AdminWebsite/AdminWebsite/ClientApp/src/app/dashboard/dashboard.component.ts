import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserIdentityService } from '../services/user-identity.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit {

  constructor(private router: Router, private userIdentityService: UserIdentityService) { }
  showCheckList = false;
  showBooking = false;

    ngOnInit() {
        this.userIdentityService
            .getUserInformation()
            .subscribe(s => {
              this.showCheckList = s.is_vh_officer_administrator_role;
              this.showBooking = s.is_case_administrator || s.is_vh_officer_administrator_role;
              if (!this.showCheckList && !this.showBooking) {
                this.router.navigate(['/unauthorised']);
              }
            });
  }

  goToCreateHearing() {
    this.router.navigate(['/book-hearing']);
  }
}

