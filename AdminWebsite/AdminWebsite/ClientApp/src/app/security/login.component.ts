import { Router, ActivatedRoute } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ReturnUrlService } from '../services/return-url.service';
import { LoggerService } from '../services/logger.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})

@Injectable()
export class LoginComponent implements OnInit {
  constructor(private adalSvc: AdalService,
    private route: ActivatedRoute,
    private router: Router,
    private logger: LoggerService,
    private returnUrlService: ReturnUrlService) {
  }

  ngOnInit() {
    if (this.adalSvc.userInfo.authenticated) {
      console.log(`return url = ${returnUrl}`);
      const returnUrl = this.returnUrlService.popUrl() || '/';
      try {
        this.router.navigateByUrl(returnUrl);
      } catch (err) {
        this.logger.error('Failed to navigate to redirect url, possibly stored url is invalid', err, returnUrl);
        this.router.navigate(['/']);
      }
    } else {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
      this.returnUrlService.setUrl(returnUrl);
      this.adalSvc.login();
    }
  }
}
