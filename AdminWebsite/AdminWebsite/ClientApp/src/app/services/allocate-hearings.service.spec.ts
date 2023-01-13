import { TestBed } from '@angular/core/testing';

import { AllocateHearingsService } from './allocate-hearings.service';

describe('AllocateHearingsService', () => {
    let service: AllocateHearingsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AllocateHearingsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
