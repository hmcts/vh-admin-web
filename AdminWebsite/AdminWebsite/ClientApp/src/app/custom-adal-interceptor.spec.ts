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

  it('should add cache headers to get requests', inject([CustomAdalInterceptor], (service: CustomAdalInterceptor) => {
    let modifiedRequest: HttpRequest<any> = null;
    adalInspector.intercept.and.callFake((customRequest: HttpRequest<any>, _: any) => {
      modifiedRequest = customRequest;
    });

    const next: any = {};
    const request = new HttpRequest<any>('GET', 'url');
    service.intercept(request, next);

    expect(modifiedRequest).not.toBeNull();
    console.log(modifiedRequest.headers);
    expect(modifiedRequest.headers.get('Cache-Control')).toEqual('no-cache');
    expect(modifiedRequest.headers.get('Pragma')).toEqual('no-cache');
  }));

});
