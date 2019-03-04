import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { Router, ActivatedRoute } from '@angular/router';
import { LoggerService } from '../services/logger.service';
import { ReturnUrlService } from '../services/return-url.service';

export class MockAdalService {
  userInfo = {
      authenticated: false
  };

  setAuthenticated(authenticated: boolean) {
      this.userInfo = {
          authenticated: authenticated
      };
  }

  login() {}
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let route: ActivatedRoute;
  let adalService: MockAdalService;
  let returnUrl: jasmine.SpyObj<ReturnUrlService>;
  let logger: jasmine.SpyObj<LoggerService>;

  const routes = [
    { path: 'login', component: LoginComponent }
  ];

  beforeEach(async(() => {
    logger = jasmine.createSpyObj('LoggerService', ['error']);
    returnUrl = jasmine.createSpyObj('ReturnUrlService', ['popUrl', 'setUrl']);

    TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      providers: [
        { provide: AdalService, useClass: MockAdalService },
        { provide: LoggerService, useValue: logger },
        { provide: ReturnUrlService, useValue: returnUrl }
      ],
      imports: [
        RouterTestingModule.withRoutes(routes)
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    router.initialNavigation()
    route = TestBed.get(ActivatedRoute);
    adalService = TestBed.get(AdalService);
    adalService.login = jasmine.createSpy('login');
  });

  it('should store return url if supplied', () => {
    adalService.setAuthenticated(false);
    route.snapshot.queryParams['returnUrl'] = '/returnPath';
    component.ngOnInit();
    expect(adalService.login).toHaveBeenCalled();
    expect(returnUrl.setUrl).toHaveBeenCalledWith('/returnPath');
  });

  it('should fallback to root url if return url is invalid', () => {
    adalService.setAuthenticated(true);
    spyOn(router, 'navigate').and.callFake(() => {});
    spyOn(router, 'navigateByUrl').and.callFake(() => { throw new Error('Invalid URL')});
    component.ngOnInit();
    expect(logger.error).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should use saved return url', () => {
    adalService.setAuthenticated(true);
    returnUrl.popUrl.and.returnValue('testurl');
    spyOn(router, 'navigateByUrl').and.callFake(() => {});
    component.ngOnInit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('testurl');
  });

  it('should return to root url if no return path is given', () => {
    adalService.setAuthenticated(true);
    spyOn(router, 'navigateByUrl').and.callFake(() => {});
    component.ngOnInit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
