import { Component, Input } from '@angular/core';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';

@Component({
  selector: 'app-hearing-details',
  templateUrl: 'hearing-details.component.html',
  styleUrls: ['hearing-details.component.css']
})
export class HearingDetailsComponent {
  @Input() hearing: BookingsDetailsModel = null;

  constructor() { }
}
