import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddJudicialPanelMemberFormComponent } from './add-judicial-panel-member-form.component';

describe('AddJudicialPanelMemberFormComponent', () => {
    let component: AddJudicialPanelMemberFormComponent;
    let fixture: ComponentFixture<AddJudicialPanelMemberFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddJudicialPanelMemberFormComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AddJudicialPanelMemberFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
