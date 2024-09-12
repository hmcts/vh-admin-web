import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ConfigService } from './config.service';
import { FeatureFlags, LaunchDarklyService } from './launch-darkly.service';
import { LDClient } from 'launchdarkly-js-client-sdk';
import { of } from 'rxjs';
import { Logger } from './logger';

describe('LaunchDarklyService', () => {
    let service: LaunchDarklyService;
    const configServiceSpy = jasmine.createSpyObj('ConfigService', ['getClientSettings']);
    configServiceSpy.getClientSettings.and.returnValue(
        of({ launch_darkly_client_id: 'client_id', vh_idp_settings: { redirect_uri: 'unittest' } })
    );
    const ldClientSpy = jasmine.createSpyObj<LDClient>('LDClient', ['waitUntilReady', 'allFlags', 'on', 'variation', 'close']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: ConfigService, useValue: configServiceSpy }, Logger]
        });
        service = TestBed.inject(LaunchDarklyService);
    });

    it('LD client should be intialised', () => {
        service.initialize();
        expect(service.client).toBeDefined();
    });

    it('should close client onDestroy', () => {
        ldClientSpy.close.calls.reset();
        service.client = ldClientSpy;

        service.ngOnDestroy();

        expect(ldClientSpy.close).toHaveBeenCalled();
    });

    it('should return a given flag', fakeAsync(() => {
        service.client = ldClientSpy;
        const flagKey = FeatureFlags.interpreterEnhancements;
        const keyParam = `change:${flagKey}`;
        ldClientSpy.on.withArgs(keyParam, jasmine.anything()).and.returnValue();
        ldClientSpy.waitUntilReady.and.returnValue(Promise.resolve());
        ldClientSpy.variation.withArgs(flagKey, jasmine.any(Boolean)).and.returnValue(true);

        let result: boolean;
        service.getFlag<boolean>(flagKey).subscribe(val => (result = val));
        tick();

        expect(result).toBe(true);
    }));
});
