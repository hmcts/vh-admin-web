import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JudicialParticipantDetailsComponent } from './judicial-participant-details.component';

describe('JudicialParticipantDetailsComponent', () => {
    let component: JudicialParticipantDetailsComponent;
    let fixture: ComponentFixture<JudicialParticipantDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JudicialParticipantDetailsComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(JudicialParticipantDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
