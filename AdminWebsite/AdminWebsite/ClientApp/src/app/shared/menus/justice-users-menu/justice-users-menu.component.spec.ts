import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JusticeUsersMenuComponent } from './justice-users-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { UntypedFormBuilder } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { of, throwError } from 'rxjs';
import { JusticeUserResponse } from '../../../services/clients/api-client';

describe('JusticeUsersMenuComponent', () => {
    let component: JusticeUsersMenuComponent;
    let fixture: ComponentFixture<JusticeUsersMenuComponent>;
    let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;

    beforeEach(async () => {
        videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingsService', ['getUsers']);
        videoHearingServiceSpy.getUsers.and.returnValue(of([new JusticeUserResponse()]));

        await TestBed.configureTestingModule({
            declarations: [JusticeUsersMenuComponent],
            providers: [
                HttpClient,
                HttpHandler,
                UntypedFormBuilder,
                { provide: Logger, useValue: new MockLogger() },
                { provide: VideoHearingsService, useValue: videoHearingServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JusticeUsersMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render menu item', () => {
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.govuk-label').textContent).toContain('Allocated CSO');
    });

    describe('enable', () => {
        it('should call base enable function, to enable this component', () => {
            component.enabled(true);
            expect(component.form.controls[component.formGroupName].enabled).toEqual(true);
        });
        it('should call base enable function, to disable this component', () => {
            component.enabled(false);
            expect(component.form.controls[component.formGroupName].enabled).toEqual(false);
        });
    });

    describe('loadItems', () => {
        it('should call video hearing service', () => {
            const expectedResponse = [new JusticeUserResponse()];
            component.loadItems();
            expect(videoHearingServiceSpy.getUsers).toHaveBeenCalled();
            expect(component.users).toEqual(expectedResponse);
        });

        it('should call video hearing service, and catch thrown exception', () => {
            videoHearingServiceSpy.getUsers.and.returnValue(throwError({ status: 404 }));

            const handleListErrorSpy = spyOn(component, 'handleListError');
            component.loadItems();
            expect(videoHearingServiceSpy.getUsers).toHaveBeenCalled();
            expect(handleListErrorSpy).toHaveBeenCalled();
        });
    });
});
