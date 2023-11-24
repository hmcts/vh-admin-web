import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReformLoginComponent } from './reform-login.component';

describe('ReformLoginComponent', () => {
    let component: ReformLoginComponent;
    let fixture: ComponentFixture<ReformLoginComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ReformLoginComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ReformLoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
