import { TestBed, inject } from '@angular/core/testing';

import { ReferenceDataService } from './reference-data.service';
import { HttpClientModule } from '@angular/common/http';

describe('ReferenceDataService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [ReferenceDataService]
        });
    });

    it('should be created', inject([ReferenceDataService], (service: ReferenceDataService) => {
        expect(service).toBeTruthy();
    }));
});
