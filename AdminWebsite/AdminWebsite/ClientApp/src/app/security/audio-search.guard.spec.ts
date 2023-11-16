import { fakeAsync, TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { Router } from '@angular/router';
import { MockOidcSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Logger } from '../services/logger';
import { AudioSearchGuard } from './audio-search.guard';
import { LaunchDarklyService } from '../services/launch-darkly.service';
import { MockLaunchDarklyService } from '../testing/mocks/MockLaunchDarklyService';

describe('audiosearchguard', () => {
    let audioSearchGuard: AudioSearchGuard;
    let launchDarklyService;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
    const router = {
        navigate: jasmine.createSpy('navigate')
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AuthGuard,
                { provide: LaunchDarklyService, useClass: MockLaunchDarklyService },
                { provide: Router, useValue: router },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
        launchDarklyService = TestBed.inject(LaunchDarklyService);
        audioSearchGuard = TestBed.inject(AudioSearchGuard);
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', () => {
            launchDarklyService.setAudioSearchFlag(true);
            audioSearchGuard.canActivate().subscribe(result => expect(result).toBeTruthy());
        });
    });

    describe('when login failed with unsuccessful authentication', () => {
        it('canActivate should return false', fakeAsync(() => {
            launchDarklyService.setAudioSearchFlag(false);
            audioSearchGuard.canActivate().subscribe(result => expect(result).toBeFalsy());
        }));
    });
});
