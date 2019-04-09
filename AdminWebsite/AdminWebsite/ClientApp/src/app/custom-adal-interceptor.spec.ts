import { TestBed, inject } from '@angular/core/testing';
import { CustomAdalInterceptor } from './custom-adal-interceptor';
import { AdalInterceptor } from 'adal-angular4';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from './testing/mocks/MockAdalService';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { BHClient } from './services/clients/api-client';
import { HTTP_INTERCEPTORS, HttpRequest, HttpResponse } from '@angular/common/http';

let adalInspector: jasmine.SpyObj<AdalInterceptor>;
adalInspector = jasmine.createSpyObj('AdalInterceptor',  ['intercept']);

describe('CustomAdalInterceptor', () => {
  
  const next: any = {
    handle: (request: HttpRequest<any>) => ({
      
    })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomAdalInterceptor,
        { provide: AdalInterceptor, useValue: adalInspector },
        { provide: AdalService, useClass: MockAdalService },
      ]
    });
  });

  it('should be created', inject([CustomAdalInterceptor], (service: CustomAdalInterceptor) => {
    expect(service).toBeTruthy();
  }));

  it('should have added cache headers', inject([CustomAdalInterceptor], (service: CustomAdalInterceptor) => {
    let response: HttpResponse<any>;
    const next: any = {
      handle: responseHandle => {
        response = responseHandle;
      }
    };

    const request: HttpRequest<any> = new HttpRequest<any>("GET", 'https://localhost:5400/api/courts');
    service.intercept(request, next);
    //expect(response.headers.get("Cache-Control")).toEqual("no-cache");
  }));

});
