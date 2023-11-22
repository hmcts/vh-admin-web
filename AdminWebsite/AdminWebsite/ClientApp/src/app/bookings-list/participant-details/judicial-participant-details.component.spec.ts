import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JudicialParticipantDetailsComponent } from './judicial-participant-details.component';
import { JudiciaryParticipantDetailsModel } from 'src/app/common/model/judiciary-participant-details.model';
import { BookingDetailsTestData } from '../booking-details/booking-details.component.spec';
import { By } from '@angular/platform-browser';

describe('JudicialParticipantDetailsComponent', () => {
    let component: JudicialParticipantDetailsComponent;
    let fixture: ComponentFixture<JudicialParticipantDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JudicialParticipantDetailsComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(JudicialParticipantDetailsComponent);
        component = fixture.componentInstance;
    });

    describe('Participant is a Judge', () => {
        it('should display a judge without contact details', () => {
            const participant = new JudiciaryParticipantDetailsModel(
                'Mr',
                'John',
                'Doe',
                'John Doe',
                'john@doe.com',
                '1234567890',
                'A1234',
                'Judge',
                'Judge John'
            );
            const hearing = new BookingDetailsTestData().getBookingsDetailsModel();

            component.participant = participant;
            component.hearing = hearing;
            component.vh_officer_admin = false;

            fixture.detectChanges();

            expect(component).toBeTruthy();

            const imgElement = fixture.debugElement.nativeElement.querySelector('img[src="/assets/images/govuk-crest.png"]');
            expect(imgElement).toBeTruthy();

            const nameElement = fixture.debugElement.query(By.css('#judge-name'));
            expect(nameElement.nativeElement.textContent).toContain(participant.displayName);

            const contactElement = fixture.debugElement.query(By.css('contact'));
            expect(contactElement).toBeNull();
        });

        it('should display a judge with contact details', () => {
            const participant = new JudiciaryParticipantDetailsModel(
                'Mr',
                'John',
                'Doe',
                'John Doe',
                'john@doe.com',
                '1234567890',
                'A1234',
                'Judge',
                'Judge John'
            );
            const hearing = new BookingDetailsTestData().getBookingsDetailsModel();

            component.participant = participant;
            component.hearing = hearing;
            component.vh_officer_admin = true;

            fixture.detectChanges();

            expect(component).toBeTruthy();

            const imgElement = fixture.debugElement.nativeElement.querySelector('img[src="/assets/images/govuk-crest.png"]');
            expect(imgElement).toBeTruthy();

            const nameElement = fixture.debugElement.query(By.css('#judge-name'));
            expect(nameElement.nativeElement.textContent).toContain(participant.displayName);

            const emailDiv = fixture.debugElement.nativeElement.querySelector(`#participant-${participant.personalCode}-email`);
            expect(emailDiv.textContent).toContain(component.participant.email);

            const phoneDiv = fixture.debugElement.nativeElement.querySelector(`#participant-${participant.personalCode}-phone`);
            expect(phoneDiv.textContent).toContain(component.participant.telephone);
        });

        it('should display TBC when no phone number is provided', () => {
            const participant = new JudiciaryParticipantDetailsModel(
                'Mr',
                'John',
                'Doe',
                'John Doe',
                'john@doe.com',
                null,
                'A1234',
                'Judge',
                'Judge John'
            );
            const hearing = new BookingDetailsTestData().getBookingsDetailsModel();

            component.participant = participant;
            component.hearing = hearing;
            component.vh_officer_admin = true;

            fixture.detectChanges();

            expect(component).toBeTruthy();

            const imgElement = fixture.debugElement.nativeElement.querySelector('img[src="/assets/images/govuk-crest.png"]');
            expect(imgElement).toBeTruthy();

            const nameElement = fixture.debugElement.query(By.css('#judge-name'));
            expect(nameElement.nativeElement.textContent).toContain(participant.displayName);

            const emailDiv = fixture.debugElement.nativeElement.querySelector(`#participant-${participant.personalCode}-email`);
            expect(emailDiv.textContent).toContain(component.participant.email);

            const phoneDiv = fixture.debugElement.nativeElement.querySelector(`#participant-${participant.personalCode}-phone`);
            expect(phoneDiv.textContent).toContain('TBC');
        });
    });

    describe('Participant is a Panel Member', () => {
        it('should display a panel member without contact details', () => {
            const participant = new JudiciaryParticipantDetailsModel(
                'Mr',
                'John',
                'Doe',
                'John Doe',
                'john@doe.com',
                '1234567890',
                'A1234',
                'PanelMember',
                'PM John'
            );
            const hearing = new BookingDetailsTestData().getBookingsDetailsModel();

            component.participant = participant;
            component.hearing = hearing;
            component.vh_officer_admin = false;

            fixture.detectChanges();

            expect(component).toBeTruthy();

            const imgElement = fixture.debugElement.nativeElement.querySelector('img[src="/assets/images/govuk-crest.png"]');
            expect(imgElement).toBeNull();

            const nameElement = fixture.debugElement.query(By.css('#judge-name'));
            expect(nameElement).toBeNull();

            const contactElement = fixture.debugElement.query(By.css('contact'));
            expect(contactElement).toBeNull();
        });

        it('should display a panel member with contact details', () => {
            const participant = new JudiciaryParticipantDetailsModel(
                'Mr',
                'John',
                'Doe',
                'John Doe',
                'john@doe.com',
                '1234567890',
                'A1234',
                'PanelMember',
                'PM John'
            );
            const hearing = new BookingDetailsTestData().getBookingsDetailsModel();

            component.participant = participant;
            component.hearing = hearing;
            component.vh_officer_admin = true;

            fixture.detectChanges();

            expect(component).toBeTruthy();

            const imgElement = fixture.debugElement.nativeElement.querySelector('img[src="/assets/images/govuk-crest.png"]');
            expect(imgElement).toBeNull();

            const nameElement = fixture.debugElement.query(By.css('#judge-name'));
            expect(nameElement).toBeNull();

            const emailDiv = fixture.debugElement.nativeElement.querySelector(`#participant-${participant.personalCode}-email`);
            expect(emailDiv.textContent).toContain(component.participant.email);

            const phoneDiv = fixture.debugElement.nativeElement.querySelector(`#participant-${participant.personalCode}-phone`);
            expect(phoneDiv.textContent).toContain(component.participant.telephone);
        });
    });
});
