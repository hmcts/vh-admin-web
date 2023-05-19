import { TestBed } from '@angular/core/testing';

import { LoadingSpinnerService } from './loading-spinner.service';

describe('LoadingSpinnerService', () => {
    let service: LoadingSpinnerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LoadingSpinnerService);
    });

    it('should increment counter by one when requestStarted is called', () => {
        service.requestStarted();
        expect(service['currentRequests']).toEqual(1);
    });

    it('should decrement counter by one when requestEnded is called', () => {
        service.requestEnded();
        expect(service['currentRequests']).toEqual(-1);
    });
});
