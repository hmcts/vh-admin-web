import { TestBed } from '@angular/core/testing';

import { JudicialService } from './judicial.service';

describe('JudicialService', () => {
    let service: JudicialService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(JudicialService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
