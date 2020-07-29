import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { ConfigService } from './config.service';
import { BHClient, ClientSettingsResponse } from '../services/clients/api-client';
import { of } from 'rxjs';
import { Logger } from '../services/logger';

describe('config service', () => {
  let bhClientSpy: jasmine.SpyObj<BHClient>;
  let clientSettings: ClientSettingsResponse;
  let configService: ConfigService;
  const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [ConfigService,
        { provide: BHClient, useValue: bhClientSpy },
        { provide: Logger, useValue: loggerSpy },
      ]
    });
    bhClientSpy = jasmine.createSpyObj<BHClient>('BHClient', ['getConfigSettings']);
    clientSettings = new ClientSettingsResponse();
    clientSettings.tenant_id = 'tenantId';
    clientSettings.client_id = 'clientId';
    clientSettings.post_logout_redirect_uri = '/dashboard';
    clientSettings.redirect_uri = '/dashboard';
    bhClientSpy.getConfigSettings.and.returnValue(of(clientSettings));
    configService = TestBed.inject(ConfigService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should not have called method on bh client', () => {
    sessionStorage.setItem('clientSettings', JSON.stringify(clientSettings));
    configService.getClientSettings();
    expect(bhClientSpy.getConfigSettings).not.toHaveBeenCalled();
  });
});
