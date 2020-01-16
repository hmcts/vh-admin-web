import { TestBed, inject } from '@angular/core/testing';
import { UserDataService } from './user-data.service';
import { HttpClientModule } from '@angular/common/http';

describe('UserDataService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [UserDataService]
        });
    });

    it('should be created', inject([UserDataService], (service: UserDataService) => {
        expect(service).toBeTruthy();
    }));
});
