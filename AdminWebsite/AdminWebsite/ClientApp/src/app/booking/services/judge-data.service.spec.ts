import { TestBed, inject } from '@angular/core/testing';
import { JudgeDataService } from './judge-data.service';
import { HttpClientModule } from '@angular/common/http';

describe('JudgeDataService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [JudgeDataService]
        });
    });

    it('should be created', inject([JudgeDataService], (service: JudgeDataService) => {
        expect(service).toBeTruthy();
    }));
});
