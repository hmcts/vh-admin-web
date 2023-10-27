import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddJudicialOfficeHoldersComponent } from './add-judicial-office-holders.component';

describe('AddJudicialOfficeHoldersComponent', () => {
    let component: AddJudicialOfficeHoldersComponent;
    let fixture: ComponentFixture<AddJudicialOfficeHoldersComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddJudicialOfficeHoldersComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AddJudicialOfficeHoldersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
