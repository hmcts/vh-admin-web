import { fakeAsync, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
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
                AudioSearchGuard,
                { provide: LaunchDarklyService, useClass: MockLaunchDarklyService },
                { provide: Router, useValue: router },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
        launchDarklyService = TestBed.inject(LaunchDarklyService);
        audioSearchGuard = TestBed.inject(AudioSearchGuard);
    });

    describe('when toggle off with successful authentication', () => {
        it('canActivate should return true', () => {
            launchDarklyService.setAudioSearchFlag(false);
            audioSearchGuard.canActivate().subscribe(result => expect(result).toBeTruthy());
        });
    });

    describe('when toggle is on with successful authentication', () => {
        it('canActivate should return false', fakeAsync(() => {
            launchDarklyService.setAudioSearchFlag(true);
            audioSearchGuard.canActivate().subscribe(result => expect(result).toBeFalsy());
        }));
    });
});
