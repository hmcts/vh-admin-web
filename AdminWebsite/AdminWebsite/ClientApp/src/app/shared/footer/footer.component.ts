import { Component, OnInit } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  hideContactUsLink = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof ResolveEnd)
    ).subscribe(() => this.hideContactUs());
  }

  ngOnInit() {
    this.hideContactUs();
  }

  hideContactUs() {
    this.hideContactUsLink = this.router.url === '/contact-us';
  }
}






