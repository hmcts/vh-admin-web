import { HttpClient, HttpClientModule } from '@angular/common/http';
import { discardPeriodicTasks, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConnectionServiceConfigToken } from './connection';
import { ConnectionService } from './connection.service';

// two separate describes() here, to allow for different module configurations

describe('Connection service (connected)', () => {
    let service: ConnectionService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [
                HttpClient,
                // inject a short interval, 1s, just for testing
                { provide: ConnectionServiceConfigToken, useValue: { interval: 1000 } }
            ]
        });
    });

    it('should make requests on the interval', fakeAsync(inject([HttpClient], (http: HttpClient) => {
        // construct the service inside the async zone
        // otherwise, timer runs outside async zone & is unaffected by tick()
        service = TestBed.inject(ConnectionService);

        // cannot run XHR requests inside fakeAsync zone, so replace it with a spy
        // return a positive response (just a 'complete') from the HEAD request
        spyOn(http, 'head').and.returnValue(of());

        // simulate 0 ms elapsed to start the timer in the service (required)
        tick(0);
        expect(http.head).toHaveBeenCalledTimes(1);

        // two subsequent ticks should each increment the number of requests
        tick(1000);
        expect(http.head).toHaveBeenCalledTimes(2);
        tick(1000);
        expect(http.head).toHaveBeenCalledTimes(3);

        // clear the task queue
        discardPeriodicTasks();
    })));

    it('hasConnection subject emits true', (done) => {
        service = TestBed.inject(ConnectionService);
        service.hasConnection$.subscribe(x => {
            expect(x).toBeTruthy();
            done();
        });
    });
});

describe('connection service (disconnected)', () => {

    // bad URL to be injected
    const url = 'nothing/to/see/here';

    let service: ConnectionService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ConnectionService,
                { provide: ConnectionServiceConfigToken, useValue: { url, maxRetryAttempts: 2 } }
            ],
            imports: [HttpClientModule]
        });

        service = TestBed.inject(ConnectionService);
    });

    it('hasConnection subject emits false after specified number of retries', (done) => {
        service.hasConnection$.subscribe(x => {
            expect(x).toBeFalsy();
            done();
        });
    });

});
