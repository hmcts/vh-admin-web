import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ConnectionService } from '../services/connection/connection.service';
import { PageTrackerService } from '../services/page-tracker.service';
import { ErrorComponent } from './error.component';

describe('ErrorComponent', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    let httpClient: jasmine.SpyObj<HttpClient>;
    let pageTracker: jasmine.SpyObj<PageTrackerService>;
    const connection = {
        hasConnection$: {
            subscribe: () => of(null),
            pipe: () => of(null),
        }
    };

    beforeEach(
        waitForAsync(() => {
            httpClient = jasmine.createSpyObj<HttpClient>(['head']);
            TestBed.configureTestingModule({
                declarations: [ErrorComponent],
                providers: [
                    { provide: Router, useValue: jasmine.createSpyObj<Router>(['navigate']) },
                    { provide: HttpClient, useValue: httpClient },
                    { provide: ConnectionService, useValue: connection },
                    { provide: PageTrackerService, useValue: pageTracker },
                ],
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
});
