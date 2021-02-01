import { HttpClient, HttpClientModule } from '@angular/common/http';
import { discardPeriodicTasks, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConnectionServiceConfigToken } from './connection';
import { ConnectionService } from './connection.service';

describe('connection service', () => {
    let service: ConnectionService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [
                HttpClient,
                { provide: ConnectionServiceConfigToken, useValue: { interval: 1000 } }
            ]
        });
    });

    it('should make requests on the interval', fakeAsync(inject([HttpClient], (http: HttpClient) => {
        service = TestBed.inject(ConnectionService);
        // return a positive response from the HEAD request
        spyOn(http, 'head').and.returnValue(of());
        // simulate 0 ms elapsed to start the timer in the service
        tick(0);
        expect(http.head).toHaveBeenCalledTimes(1);
        tick(1000);
        expect(http.head).toHaveBeenCalledTimes(2);
        tick(1000);
        expect(http.head).toHaveBeenCalledTimes(3);
        // clear the task queue
        discardPeriodicTasks();
    })));
});
