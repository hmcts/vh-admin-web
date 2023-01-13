import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocateHearingsComponent } from './allocate-hearings.component';
import { ActivatedRoute } from '@angular/router';
import { ActivatedRouteStub } from '../../testing/stubs/activated-route-stub';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('AllocateHearingsComponent', () => {
    let component: AllocateHearingsComponent;
    let fixture: ComponentFixture<AllocateHearingsComponent>;
    let activatedRoute: ActivatedRouteStub;

    beforeEach(async () => {
        activatedRoute = new ActivatedRouteStub();
        await TestBed.configureTestingModule({
            declarations: [AllocateHearingsComponent],
            providers: [{ provide: ActivatedRoute, useValue: activatedRoute }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AllocateHearingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    /*
    describe('ngOnInit', () => {
        it('should be called with unallocated "today" parameter', () => {
            activatedRoute.testParams = { unallocated: 'today' };
            const componentSpy = spyOn(component, 'searchUnallocatedHearings');
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(componentSpy).toHaveBeenCalledWith('today');
        });
        it('should be called with unallocated "tomorrow" parameter', () => {
            activatedRoute.testParams = { unallocated: 'tomorrow' };
            const componentSpy = spyOn(component, 'searchUnallocatedHearings');
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(componentSpy).toHaveBeenCalledWith('tomorrow');
        });
        it('should be called with unallocated "week" parameter', () => {
            activatedRoute.testParams = { unallocated: 'week' };
            const componentSpy = spyOn(component, 'searchUnallocatedHearings');
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(componentSpy).toHaveBeenCalledWith('week');
        });
        it('should be called with unallocated "month" parameter', () => {
            activatedRoute.testParams = { unallocated: 'month' };
            const componentSpy = spyOn(component, 'searchUnallocatedHearings');
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(componentSpy).toHaveBeenCalledWith('month');
        });

    }); */
});
