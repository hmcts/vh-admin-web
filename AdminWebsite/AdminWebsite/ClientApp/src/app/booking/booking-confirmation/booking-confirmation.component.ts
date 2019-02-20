import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-booking-confirmation',
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.css']
})
export class BookingConfirmationComponent implements OnInit {
  @Input() message: string;

  constructor() { }

  ngOnInit() {
  }

}
