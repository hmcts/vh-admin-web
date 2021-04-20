import { TestBed, inject } from '@angular/core/testing';
import { JudgeDataService } from './judge-data.service';
import { HttpClientModule } from '@angular/common/http';
import { BHClient } from 'src/app/services/clients/api-client';

describe('JudgeDataService', () => {
    let bhClientSpy: jasmine.SpyObj<BHClient>;
    beforeEach(() => {
        bhClientSpy = jasmine.createSpyObj<BHClient>('BHClient', ['getJudges', 'searchJudgesByEmail']);
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [JudgeDataService, { provide: BHClient, useValue: bhClientSpy }]
        });
    });

    it('should be created', inject([JudgeDataService], (service: JudgeDataService) => {
        expect(service).toBeTruthy();
    }));


    it('should call getJudges', inject([JudgeDataService], (service: JudgeDataService) => {
        service.getJudges();
        expect(bhClientSpy.getJudges).toHaveBeenCalledTimes(1);
    }));

    it('should call searchJudgesByEmail with correct term', inject([JudgeDataService], (service: JudgeDataService) => {
        const term = 'term';
        service.searchJudgesByEmail(term);
        expect(bhClientSpy.searchJudgesByEmail).toHaveBeenCalledTimes(1);
        expect(bhClientSpy.searchJudgesByEmail).toHaveBeenCalledWith(term);
    }));
});
