import { EmailValidationService } from './email-validation.service';
import { ConfigService } from 'src/app/services/config.service';
import { Logger } from '../../services/logger';
import { ClientSettingsResponse } from '../../services/clients/api-client';
import { of } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';

describe('EmailValidationService', () => {
    const configSettings = new ClientSettingsResponse();
    configSettings.test_username_stem = '@hmcts.net';
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    configServiceSpy = jasmine.createSpyObj<ConfigService>('CongigService', ['getClientSettings']);
    configServiceSpy.getClientSettings.and.returnValue(of(configSettings));
    loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['info', 'error']);
    const service = new EmailValidationService(configServiceSpy, loggerSpy);

    it('should config service return email pattern for validation', fakeAsync(async () => {
        const invalidPattern = await service.getEmailPattern();
        tick();
        expect(invalidPattern).toBe('@hmcts.net');
        expect(loggerSpy.info).toHaveBeenCalled();
    }));
    it('should log error if config service return no email pattern for validation', fakeAsync(async () => {
        configServiceSpy.getClientSettings.calls.reset();
        configSettings.test_username_stem = '';
        configServiceSpy.getClientSettings.and.returnValue(of(configSettings));
        const invalidPattern = await service.getEmailPattern();
        tick();
        expect(invalidPattern).toBe('');
        expect(loggerSpy.error).toHaveBeenCalled();
    }));
    it('should validate email and return true', () => {
        expect(service.validateEmail('correct.email@test.com', 'invalid.pattern')).toBe(true);
    });
    it('should validate email and return false if it has invalid pattern', () => {
        expect(service.validateEmail('invalid.email@invalid.pattern', 'invalid.pattern')).toBe(false);
    });
});
