import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageReferenceDataComponent } from './manage-reference-data.component';

describe('ManageReferenceDataComponent', () => {
    let component: ManageReferenceDataComponent;
    let fixture: ComponentFixture<ManageReferenceDataComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ManageReferenceDataComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageReferenceDataComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
