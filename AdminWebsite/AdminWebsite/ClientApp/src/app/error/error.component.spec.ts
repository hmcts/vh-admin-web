import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ConnectionService } from '../services/connection/connection.service';
import { PageTrackerService } from '../services/page-tracker.service';
import { ErrorComponent } from './error.component';

describe('ErrorComponent', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    const pageTracker = {
        getPreviousUrl: () => 'some-url'
    }

    const router = {
        navigate: () => {}
    };

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ErrorComponent],
                imports: [HttpClientTestingModule],
                providers: [
                    { provide: Router, useValue: router },
                    HttpClient,
                    ConnectionService,
                    { provide: PageTrackerService, useValue: pageTracker }
                ]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate on successful reconnect',
        inject(
            [HttpClient, PageTrackerService, Router],
            (httpClient: HttpClient, tracker: PageTrackerService, router: Router) => {
                spyOn(httpClient, 'head').and.returnValue(of(true));
                spyOn(tracker, 'getPreviousUrl').and.callThrough();
                spyOn(router, 'navigate');
                component.reconnect();
                expect(httpClient.head).toHaveBeenCalled();
                expect(tracker.getPreviousUrl).toHaveBeenCalled();
                expect(router.navigate).toHaveBeenCalledWith(['some-url']);
            }));
});
