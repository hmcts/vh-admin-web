import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantListComponent } from './participant-list.component';
import { ParticipantItemComponent } from '../item/participant-item.component';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';

const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
const router = {
    navigate: jasmine.createSpy('navigate'),
    url: '/summary'
};
let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;

describe('ParticipantListComponent', () => {
    let component: ParticipantListComponent;
    let fixture: ComponentFixture<ParticipantListComponent>;
    let debugElement: DebugElement;
    const pat1 = new ParticipantModel();
    pat1.title = 'Mrs';
    pat1.first_name = 'Sam';
    pat1.addedDuringHearing = false;
    const participants: any[] = [pat1, pat1];

    beforeEach(
        waitForAsync(() => {
            videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['isConferenceClosed', 'isHearingAboutToStart']);
            TestBed.configureTestingModule({
                declarations: [ParticipantListComponent, ParticipantItemComponent],
                providers: [
                    { provide: Logger, useValue: loggerSpy },
                    { provide: Router, useValue: router },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy }
                ],
                imports: [RouterTestingModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantListComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        component.hearing = { updated_date: new Date(), questionnaire_not_required: true, participants };
        fixture.detectChanges();
    });

    it('should create participants list component', () => {
        expect(component).toBeTruthy();
    });

    it('should display participants', done => {
        component.hearing.participants = participants;
        component.ngOnInit();
        fixture.whenStable().then(() => {
            fixture.detectChanges();
            const elementArray = debugElement.queryAll(By.css('app-participant-item'));
            expect(elementArray.length).toBeGreaterThan(0);
            expect(elementArray.length).toBe(2);
            done();
        });
    });
    it('should emit on remove', () => {
        spyOn(component.$selectedForRemove, 'emit');
        component.removeParticipant({ email: 'email@hmcts.net', is_exist_person: false, is_judge: false });
        expect(component.$selectedForRemove.emit).toHaveBeenCalled();
    });
    it('should not be able to edit participant if canEdit is false', () => {
        component.canEdit = false;
        expect(component.canEditParticipant(pat1)).toBe(false);
    });
    it('should not be able to edit participant if canEdit is true and hearing is closed', () => {
        component.canEdit = true;
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
        expect(component.canEditParticipant(pat1)).toBe(false);
    });
    it('should not be able to edit participant if canEdit is true, hearing is open, hearing is about to start and addedDuringHearing is false', () => {
        component.canEdit = true;
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
        pat1.addedDuringHearing = false;
        expect(component.canEditParticipant(pat1)).toBe(false);
    });
    it('should be able to edit participant if canEdit is true, hearing is open and about to start & addedDuringHearing is true', () => {
        component.canEdit = true;
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
        pat1.addedDuringHearing = true;
        expect(component.canEditParticipant(pat1)).toBe(true);
    });
    it('should be able to edit participant if canEdit is true, hearing is open and hearing is not about to start', () => {
        component.canEdit = true;
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        expect(component.canEditParticipant(pat1)).toBe(true);
    });
});

describe('ParticipantListComponent-SortParticipants', () => {
    let component: ParticipantListComponent;
    let fixture: ComponentFixture<ParticipantListComponent>;
    let debugElement: DebugElement;

    beforeEach(
        waitForAsync(() => {
            videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['isConferenceClosed', 'isHearingAboutToStart']);
            TestBed.configureTestingModule({
                declarations: [ParticipantListComponent, ParticipantItemComponent],
                providers: [
                    { provide: Logger, useValue: loggerSpy },
                    { provide: Router, useValue: router },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy }
                ],
                imports: [RouterTestingModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantListComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        component.hearing = { updated_date: new Date(), questionnaire_not_required: true };
        fixture.detectChanges();
    });
    it('should produce a sorted list with no duplicates', () => {
        const linked_participantList: LinkedParticipantModel[] = [];
        const linked_participant = new LinkedParticipantModel();
        linked_participant.linkType = LinkedParticipantType.Interpreter;
        linked_participant.linkedParticipantId = '7';
        linked_participantList.push(linked_participant);

        const linked_participantList1: LinkedParticipantModel[] = [];
        const linked_participant1 = new LinkedParticipantModel();
        linked_participant1.linkType = LinkedParticipantType.Interpreter;
        linked_participant1.linkedParticipantId = '9';
        linked_participantList1.push(linked_participant1);

        const participantsArr = [
            { is_judge: true, hearing_role_name: 'Judge', display_name: 'Judge1', linked_participant: null },
            { is_judge: true, hearing_role_name: 'Judge', display_name: 'Judge2', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Winger', display_name: 'Winger1', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Winger', display_name: 'Winger2', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Staff Member', display_name: 'Staff Member', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Panel Member', display_name: 'Panel Member', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Observer', display_name: 'Observer', linked_participant: null },
            {
                is_judge: false,
                hearing_role_name: 'Litigant in Person',
                display_name: 'Litigant in Person1',
                linked_participant: linked_participantList1
            },
            { is_judge: false, hearing_role_name: 'Litigant in Person', display_name: 'Litigant in Person2', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Litigant in Person', display_name: 'Litigant in Person3', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Interpreter', display_name: 'Interpreter1', linked_participant: linked_participantList }
        ];

        if (!component.hearing.participants) {
            component.hearing.participants = [];
        }
        participantsArr.forEach((p, i) => {
            component.hearing.participants.push({
                is_exist_person: true,
                is_judge: p.is_judge,
                hearing_role_name: p.hearing_role_name,
                display_name: p.display_name,
                linked_participants: p.linked_participant,
                id: `${i + 1}`,
                is_courtroom_account: false
            });
        });

        component.ngOnInit();

        expect(component.sortedParticipants.length).toBe(11);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Judge').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Winger').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Panel Member').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Staff Member').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Observer').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Litigant in Person').length).toBe(3);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Interpreter').length).toBe(1);
    });
    it('should produce a sorted list with no duplicates for a new interpreter', () => {
        const linked_participantList1: LinkedParticipantModel[] = [];
        const linked_participant1 = new LinkedParticipantModel();
        linked_participant1.linkType = LinkedParticipantType.Interpreter;
        linked_participant1.linkedParticipantId = '9';
        linked_participantList1.push(linked_participant1);
        const participantsArr = [
            { is_judge: true, hearing_role_name: 'Judge', display_name: 'Judge1', interpreterFor: '', email: 'judge@hmcts.net' },
            {
                is_judge: false,
                hearing_role_name: 'Litigant in Person',
                display_name: 'Litigant in Person1',
                interpreterFor: '',
                email: 'litigantperson1@hmcts.net'
            },
            {
                is_judge: false,
                hearing_role_name: 'Interpreter',
                display_name: 'Interpreter1',
                interpreterFor: 'litigantperson1@hmcts.net',
                email: 'interpreter@hmcts.net'
            }
        ];
        if (!component.hearing.participants) {
            component.hearing.participants = [];
        }
        participantsArr.forEach((p, i) => {
            component.hearing.participants.push({
                is_exist_person: true,
                is_judge: p.is_judge,
                hearing_role_name: p.hearing_role_name,
                display_name: p.display_name,
                interpreterFor: p.interpreterFor,
                email: p.email,
                id: `${i + 1},`,
                is_courtroom_account: false
            });
        });
        component.ngOnInit();

        expect(component.sortedParticipants.length).toBe(3);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Judge').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Litigant in Person').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Interpreter').length).toBe(1);
    });
});
