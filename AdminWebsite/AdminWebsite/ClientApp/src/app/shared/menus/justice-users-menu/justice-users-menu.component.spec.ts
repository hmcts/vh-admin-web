import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JusticeUsersMenuComponent } from './justice-users-menu.component';

describe('JusticeUsersMenuComponent', () => {
    let component: JusticeUsersMenuComponent;
    let fixture: ComponentFixture<JusticeUsersMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JusticeUsersMenuComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JusticeUsersMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
