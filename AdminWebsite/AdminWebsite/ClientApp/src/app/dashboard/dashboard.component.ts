import { Component, OnInit } from '@angular/core';
import { UserIdentityService } from '../services/user-identity.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit {

  constructor(
    private userIdentityService: UserIdentityService) { }

  showCheckList = false;
  showBooking = false;

  async ngOnInit() {
    const profile = await this.userIdentityService.getUserInformation().toPromise();
    this.showCheckList = profile.is_vh_officer_administrator_role;
    this.showBooking = profile.is_case_administrator || profile.is_vh_officer_administrator_role;
  }
}
