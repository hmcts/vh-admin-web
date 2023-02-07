import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTeamComponent } from './manage-team.component';
import { FormBuilder } from '@angular/forms';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { Logger } from '../../services/logger';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { JusticeUserResponse } from '../../services/clients/api-client';
import { of, throwError } from 'rxjs';

describe('ManageTeamComponent', () => {
    let component: ManageTeamComponent;
    let fixture: ComponentFixture<ManageTeamComponent>;
    let logger: jasmine.SpyObj<Logger>;
    let videoServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    let users: JusticeUserResponse[] = [];

    beforeEach(async () => {
        videoServiceSpy = jasmine.createSpyObj('VideoHearingsService', ['getUsers']);
        users = [];
        logger = jasmine.createSpyObj('Logger', ['debug']);

        await TestBed.configureTestingModule({
            declarations: [ManageTeamComponent],
            providers: [
                FormBuilder,
                HttpClient,
                HttpHandler,
                { provide: Logger, useValue: logger },
                { provide: VideoHearingsService, useValue: videoServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ManageTeamComponent);
        component = fixture.componentInstance;

        videoServiceSpy.getUsers.calls.reset();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('searchUsers', () => {
        it('should call video hearing service and return empty list', () => {
            const emptyList: JusticeUserResponse[] = [];

            videoServiceSpy.getUsers.and.returnValue(of(emptyList));

            component.searchUsers();
            expect(videoServiceSpy.getUsers).toHaveBeenCalled();
            expect(component.message).toContain('No users matching this search criteria were found.');
            expect(component.displayAddButton).toBeTruthy();
        });

        it('should call video hearing service and return 20 result', () => {
            for (let i = 0; i < 30; i++) {
                const user: JusticeUserResponse = new JusticeUserResponse();

                user.id = i.toString();
                user.username = `username${i}@mail.com`;

                users.push(user);
            }

            videoServiceSpy.getUsers.and.returnValue(of(users));

            const expectedResponse = users.slice(0, 20);
            component.searchUsers();
            expect(videoServiceSpy.getUsers).toHaveBeenCalled();
            expect(component.users.length).toEqual(expectedResponse.length);
            expect(component.message).toContain('please refine your search to see more results.');
            expect(component.displayAddButton).toBeTruthy();
        });

        it('should call video hearing service, and catch thrown exception', () => {
            videoServiceSpy.getUsers.and.returnValue(throwError({ status: 404 }));

            const handleListErrorSpy = spyOn(component, 'handleListError');
            component.searchUsers();
            expect(videoServiceSpy.getUsers).toHaveBeenCalled();
            expect(handleListErrorSpy).toHaveBeenCalled();
            expect(component.displayAddButton).toBeFalsy();
        });
    });
});
