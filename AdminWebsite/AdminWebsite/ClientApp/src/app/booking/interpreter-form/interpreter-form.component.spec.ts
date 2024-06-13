import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterpreterFormComponent } from './interpreter-form.component';

describe('InterpreterFormComponent', () => {
    let component: InterpreterFormComponent;
    let fixture: ComponentFixture<InterpreterFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [InterpreterFormComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(InterpreterFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
