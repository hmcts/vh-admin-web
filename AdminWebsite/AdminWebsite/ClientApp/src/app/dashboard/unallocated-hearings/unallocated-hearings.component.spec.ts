import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnallocatedHearingsComponent } from './unallocated-hearings.component';

describe('UnallocatedHearingsComponent', () => {
    let component: UnallocatedHearingsComponent;
    let fixture: ComponentFixture<UnallocatedHearingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UnallocatedHearingsComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UnallocatedHearingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
