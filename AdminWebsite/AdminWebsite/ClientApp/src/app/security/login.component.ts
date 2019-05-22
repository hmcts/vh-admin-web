import { Router, ActivatedRoute } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ReturnUrlService } from '../services/return-url.service';
import { LoggerService } from '../services/logger.service';
import { WindowRef } from '../shared/window-ref';

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
    private returnUrlService: ReturnUrlService,
    private window: WindowRef) {
  }

  async ngOnInit() {
    if (this.adalSvc.userInfo.authenticated) {
      const returnUrl = this.returnUrlService.popUrl() || '/';
      try {
        console.log(`return url = ${returnUrl}`);
        await this.router.navigateByUrl(returnUrl);
      } catch (err) {
        this.logger.error('Failed to navigate to redirect url, possibly stored url is invalid', err, returnUrl);
        await this.router.navigate(['/']);
      }
    } else {
      const currentPathname = this.window.getLocation().pathname;
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

      if (!returnUrl.startsWith(currentPathname)) {
        this.returnUrlService.setUrl(returnUrl);
      }

      this.adalSvc.login();
    }
  }
}
