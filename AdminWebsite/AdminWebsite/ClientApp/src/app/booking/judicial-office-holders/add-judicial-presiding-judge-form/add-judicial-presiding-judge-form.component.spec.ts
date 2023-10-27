import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddJudicialPresidingJudgeFormComponent } from './add-judicial-presiding-judge-form.component';

describe('AddJudicialPresidingJudgeFormComponent', () => {
    let component: AddJudicialPresidingJudgeFormComponent;
    let fixture: ComponentFixture<AddJudicialPresidingJudgeFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddJudicialPresidingJudgeFormComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AddJudicialPresidingJudgeFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
