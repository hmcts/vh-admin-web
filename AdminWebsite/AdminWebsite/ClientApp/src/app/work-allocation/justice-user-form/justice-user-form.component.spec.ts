import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JusticeUserFormComponent } from './justice-user-form.component';

describe('JusticeUserFormComponent', () => {
    let component: JusticeUserFormComponent;
    let fixture: ComponentFixture<JusticeUserFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JusticeUserFormComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(JusticeUserFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
