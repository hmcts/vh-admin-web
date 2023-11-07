import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { AddJudicialOfficeHoldersComponent } from './add-judicial-office-holders.component';
import { Router } from '@angular/router';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantListComponent } from '../../participant';
import { ParticipantsListStubComponent } from 'src/app/testing/stubs/participant-list-stub';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { SearchForJudicialMemberComponent } from '../search-for-judicial-member/search-for-judicial-member.component';
import { JudicialService } from '../../services/judicial.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { JudicialMemberDto } from '../models/add-judicial-member.model';

describe('AddJudicialOfficeHoldersComponent', () => {
    let component: AddJudicialOfficeHoldersComponent;
    let fixture: ComponentFixture<AddJudicialOfficeHoldersComponent>;
    let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    let judicialServiceSpy: jasmine.SpyObj<JudicialService>;
    let bookingServiceSpy: jasmine.SpyObj<BookingService>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    let routerSpy: jasmine.SpyObj<Router>;

    let hearing: HearingModel;

    beforeEach(async () => {
        hearing = new HearingModel();
        hearing.judiciaryParticipants = [];
        videoHearingsServiceSpy = jasmine.createSpyObj('VideoHearingsService', [
            'getCurrentRequest',
            'addJudiciaryJudge',
            'addJudiciaryPanelMember',
            'removeJudiciaryParticipant',
            'updateHearingRequest'
        ]);
        judicialServiceSpy = jasmine.createSpyObj('JudicialService', ['searchJudicialMembers']);
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(hearing);
        bookingServiceSpy = jasmine.createSpyObj('BookingService', ['getParticipantEmail', 'removeParticipantEmail']);
        loggerSpy = jasmine.createSpyObj('Logger', ['debug', 'warn']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, FormsModule, ReactiveFormsModule],
            declarations: [
                AddJudicialOfficeHoldersComponent,
                ParticipantsListStubComponent,
                BreadcrumbStubComponent,
                SearchForJudicialMemberComponent
            ],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: Router, useValue: routerSpy },
                { provide: JudicialService, useValue: judicialServiceSpy },
                { provide: ParticipantListComponent, useClass: ParticipantsListStubComponent },
                { provide: BreadcrumbComponent, useClass: BreadcrumbStubComponent }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AddJudicialOfficeHoldersComponent);
        component = fixture.componentInstance;
        component.participantsListComponent = TestBed.inject(ParticipantListComponent);
        fixture.detectChanges();
    });

    afterEach(() => {
        component.destroyed$.next();
        component.destroyed$.complete();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('addPresidingJudge', () => {
        it('should add a judge to the hearing', () => {
            const judicialMember = { roleCode: 'Judge' } as any;
            component.addPresidingJudge(judicialMember);
            expect(videoHearingsServiceSpy.addJudiciaryJudge).toHaveBeenCalledWith(judicialMember);
            expect(component.judgeAssigned).toBeTrue();
            expect(component.editingJudge).toBeFalse();
            expect(component.participantToEdit).toBeNull();
        });
    });

    describe('addPanelMember', () => {
        it('should add a panel member to the hearing', () => {
            const judicialMember = { roleCode: 'PanelMember' } as any;
            component.addPanelMember(judicialMember);
            expect(videoHearingsServiceSpy.addJudiciaryPanelMember).toHaveBeenCalledWith(judicialMember);
            expect(component.showAddPanelMember).toBeFalse();
            expect(component.participantToEdit).toBeNull();
            expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
        });
    });

    describe('removeJudiciaryParticipant', () => {
        it('should remove a participant from the hearing', () => {
            const participantEmail = 'test@example.com';
            component.removeJudiciaryParticipant(participantEmail);
            expect(videoHearingsServiceSpy.removeJudiciaryParticipant).toHaveBeenCalledWith(participantEmail);
        });
    });

    describe('continueToNextStep', () => {
        it('should navigate to the add participants page', () => {
            component.continueToNextStep();
            expect(routerSpy.navigate).toHaveBeenCalledWith([PageUrls.AddParticipants]);
        });
    });

    describe('prepoplateFormForEdit', () => {
        it('should set participantToEdit and editingJudge to true when participant role is Judge', () => {
            // Arrange
            const participantEmail = 'test@example.com';
            const judicialMember = new JudicialMemberDto('Test', 'User', 'Test User', participantEmail, '1234567890', '1234');
            judicialMember.roleCode = 'Judge';
            judicialMember.displayName = 'Test User display name';
            component.hearing.judiciaryParticipants = [judicialMember];

            // Act
            component.prepoplateFormForEdit(participantEmail);

            // Assert
            expect(component.participantToEdit).toEqual(judicialMember);
            expect(component.editingJudge).toBeTrue();
            expect(component.editingPanelMember).toBeFalse();
            expect(component.showAddPanelMember).toBeFalse();
        });

        it('should set participantToEdit, editingPanelMember and showAddPanelMember to true when participant role is not Judge', () => {
            // Arrange
            const participantEmail = 'test@example.com';
            const panelMemberParticipant = new JudicialMemberDto('Test', 'User', 'Test User', participantEmail, '1234567890', '1234');
            panelMemberParticipant.roleCode = 'PanelMember';
            component.hearing.judiciaryParticipants = [panelMemberParticipant];

            // Act
            component.prepoplateFormForEdit(participantEmail);

            // Assert
            expect(component.participantToEdit).toEqual(panelMemberParticipant);
            expect(component.editingJudge).toBeFalse();
            expect(component.editingPanelMember).toBeTrue();
            expect(component.showAddPanelMember).toBeTrue();
        });

        it('should log warning when participant is not found', () => {
            // Arrange
            const participantEmail = 'test@example.com';
            component.hearing.judiciaryParticipants = [];

            // Act
            component.prepoplateFormForEdit(participantEmail);

            // Assert
            expect(loggerSpy.warn.calls.mostRecent().args[0].includes('Unable to find participant to edit.')).toBeTrue();
            expect(loggerSpy.warn.calls.mostRecent().args[1]).toBe(participantEmail);
            expect(component.participantToEdit).toBeNull();
            expect(component.editingJudge).toBeFalse();
            expect(component.editingPanelMember).toBeFalse();
            expect(component.showAddPanelMember).toBeFalse();
        });
    });
});
