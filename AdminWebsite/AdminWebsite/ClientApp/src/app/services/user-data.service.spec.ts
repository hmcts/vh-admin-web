import { inject, TestBed } from "@angular/core/testing";
import { UserDataService } from "./user-data.service";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

describe('UserDataService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
    imports: [],
    providers: [UserDataService, provideHttpClient(withInterceptorsFromDi())]
});
    });

    it('should be created', inject([UserDataService], (service: UserDataService) => {
        expect(service).toBeTruthy();
    }));
});
