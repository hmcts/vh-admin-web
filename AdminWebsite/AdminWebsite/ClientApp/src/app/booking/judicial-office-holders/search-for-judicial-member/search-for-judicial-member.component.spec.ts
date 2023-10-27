import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchForJudicialMemberComponent } from './search-for-judicial-member.component';

describe('SearchForJudicialMemberComponent', () => {
    let component: SearchForJudicialMemberComponent;
    let fixture: ComponentFixture<SearchForJudicialMemberComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SearchForJudicialMemberComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SearchForJudicialMemberComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
