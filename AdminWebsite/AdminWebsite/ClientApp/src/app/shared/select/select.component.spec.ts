import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent, SelectOption } from './select.component';
import { MockLogger } from '../testing/mock-logger';
import { Logger } from 'src/app/services/logger';
import { newGuid } from '@microsoft/applicationinsights-core-js';
import { SimpleChanges } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

describe('CaseTypesMenuComponent', () => {
    let component: SelectComponent;
    let fixture: ComponentFixture<SelectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SelectComponent],
            providers: [{ provide: Logger, useValue: new MockLogger() }],
            imports: [NgSelectModule, FormsModule]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SelectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('clear', () => {
        it('should clear arrays and emit empty array in multiple mode', () => {
            component.multiple = true;

            const csoId = newGuid();
            const username = 'test@cso.com';

            const items: SelectOption[] = [{ label: '', entityId: csoId, data: username }];
            component.items = items;
            component.selectedEntityIds = [csoId];
            component.handleOnChange();

            component.clear();

            expect(component.selectedEntityIds).toEqual([]);
            expect(component.selected).toEqual([]);
        });
        it('should clear arrays and emit nothing in single mode', () => {
            component.multiple = false;

            const csoId = newGuid();
            const username = 'test@cso.com';

            const items: SelectOption[] = [{ label: '', entityId: csoId, data: username }];
            component.items = items;
            component.selectedEntityIds = [csoId];
            component.handleOnChange();

            component.clear();

            expect(component.selectedEntityIds).toEqual([]);
            expect(component.selected).toEqual(undefined);
        });
    });

    describe('items', () => {
        it('should update selected items to reflect selectedEntityIds on input change', () => {
            // arrange
            const entityId = newGuid();
            component.selectedEntityIds = [entityId];
            const items: SelectOption[] = [{ label: '', entityId, data: 'test@cso.com' }];
            const changes: SimpleChanges = {
                items: { currentValue: items, previousValue: null, firstChange: null, isFirstChange: () => true }
            };
            component.items = items;
            fixture.detectChanges();

            // act
            component.ngOnChanges(changes);

            // assert
            expect((component.selected as SelectOption).data).toEqual('test@cso.com');
            expect((component.selected as SelectOption).entityId).toEqual(entityId);
        });

        it('should return a single object when not in multiple mode', () => {
            // arrange
            component.multiple = false;

            const entityId = newGuid();
            const entityId2 = newGuid();

            component.selectedEntityIds = [entityId, entityId2];
            const items: SelectOption[] = [
                { label: '', entityId, data: 'test@cso.com' },
                { label: '', entityId: entityId2, data: 'test@cso.com' }
            ];
            const changes: SimpleChanges = {
                items: { currentValue: items, previousValue: null, firstChange: null, isFirstChange: () => true }
            };
            component.items = items;
            fixture.detectChanges();

            // act
            component.ngOnChanges(changes);

            // assert
            expect(Array.isArray(component.selected as SelectOption)).toBe(false);
            expect((component.selected as SelectOption).data).not.toBe(null);
        });

        it('should return a single object when in multiple mode', () => {
            // arrange
            component.multiple = true;

            const entityId = newGuid();
            const entityId2 = newGuid();

            component.selectedEntityIds = [entityId, entityId2];
            const items: SelectOption[] = [
                { label: '', entityId, data: 'test@cso.com' },
                { label: '', entityId: entityId2, data: 'test@cso.com' }
            ];
            const changes: SimpleChanges = {
                items: { currentValue: items, previousValue: null, firstChange: null, isFirstChange: () => true }
            };
            component.items = items;
            fixture.detectChanges();

            // act
            component.ngOnChanges(changes);

            // assert
            expect(Array.isArray(component.selected)).toBe(true);
            expect((component.selected as SelectOption[])[0].data).toBe('test@cso.com');
        });
    });

    describe('enable & disable', () => {
        it('should enable', () => {
            component.enable();
            expect(component.disabled).toEqual(false);
        });
        it('should disable', () => {
            component.disable();
            expect(component.disabled).toEqual(true);
        });
    });
});
