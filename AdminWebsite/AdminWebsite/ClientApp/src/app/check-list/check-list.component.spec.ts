import { HttpClientModule } from '@angular/common/http';
import { Component, DebugElement, EventEmitter, Input, Output } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ChecklistService } from '../services/checklist.service';
import { ChecklistTestData } from '../testing/data/checklist-test-data';
import { CheckListComponent } from './check-list.component';
import { PaginationModel } from '../shared/pagination/pagination-model';

describe('CheckListComponent', () => {
    let component: CheckListComponent;
    let fixture: ComponentFixture<CheckListComponent>;
    let debugElement: DebugElement;

    @Component({ selector: 'app-pagination', template: '' })
    class PaginationStubComponent {
        @Input() pagination: PaginationModel = new PaginationModel(0, 1, 1, 5);

        @Output() moveToStart$ = new EventEmitter();
        @Output() moveToEnd$ = new EventEmitter();
        @Output() moveNext$ = new EventEmitter();
        @Output() movePrevious$ = new EventEmitter();
    }

    let checklistServiceSpy: jasmine.SpyObj<ChecklistService>;

    beforeEach(async(() => {
        checklistServiceSpy = jasmine.createSpyObj<ChecklistService>('ChecklistService',
            ['getChecklists']);

        TestBed.configureTestingModule({
            declarations: [CheckListComponent, PaginationStubComponent],
            imports: [FormsModule, HttpClientModule],
            providers: [
                { provide: ChecklistService, useValue: checklistServiceSpy },
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        const checklistsData = new ChecklistTestData().getTestData();
        checklistServiceSpy.getChecklists.and.returnValue(of(checklistsData));
        fixture = TestBed.createComponent(CheckListComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;

        fixture.detectChanges();
    });

    it('should create checklist component', async(async () => {
        await component.ngAfterContentInit();
        expect(component).toBeTruthy();
    }));
    it('should create checklist component', async(async () => {
        await component.ngAfterContentInit();
        expect(component).toBeTruthy();
    }));

});
