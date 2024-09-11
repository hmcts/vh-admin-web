import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreeningListItemComponent } from './screening-list-item.component';

describe('ScreeningListItemComponent', () => {
    let component: ScreeningListItemComponent;
    let fixture: ComponentFixture<ScreeningListItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ScreeningListItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ScreeningListItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
