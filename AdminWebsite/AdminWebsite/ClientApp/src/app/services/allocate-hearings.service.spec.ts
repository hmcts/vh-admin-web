import { TestBed } from '@angular/core/testing';

import { AllocateHearingsService } from './allocate-hearings.service';
import {BHClient} from "./clients/api-client";
import {Logger} from "./logger";

describe('AllocateHearingsService', () => {
    let service: AllocateHearingsService;
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let logger: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: BHClient, useValue: bHClientSpy },
                { provide: Logger, useValue: logger }
            ]
        });
        service = TestBed.inject(AllocateHearingsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
