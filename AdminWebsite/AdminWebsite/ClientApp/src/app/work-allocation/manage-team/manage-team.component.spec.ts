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
    const users: JusticeUserResponse[] = [];

    beforeEach(async () => {
        videoServiceSpy = jasmine.createSpyObj('VideoHearingsService', [
            'getUsers'
        ]);

        logger = jasmine.createSpyObj('Logger', [
            'debug'
        ]);




        let user:JusticeUserResponse = new JusticeUserResponse();

        user.id = '1';
        user.username = 'username1@mail.com';

        users.push(user);

        videoServiceSpy.getUsers.and.returnValue(of(users));

        await TestBed.configureTestingModule({
            declarations: [ ManageTeamComponent ],
            providers: [
                FormBuilder, HttpClient, HttpHandler,
                { provide: Logger, useValue: logger },
                { provide: VideoHearingsService, useValue: videoServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ManageTeamComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('searchUsers', () => {
        it('should call video hearing service', () => {
            const expectedResponse = users;
            component.searchUsers();
            expect(videoServiceSpy.getUsers).toHaveBeenCalled();
            expect(component.users).toEqual(expectedResponse);
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

    describe('editUser', () => {
        it('should enable all inputs in the selected row ', () => {
            const expectedResponse = [new JusticeUserResponse()];
            component.editUser('1');
            //component.elRef.nativeElement.getElementsByClassName(id)
        });

    });
});
